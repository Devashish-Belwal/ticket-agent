import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  state,
  type TicketStatus,
  type AgentRun,
  type ToolCall,
  type Message,
} from "../state";
import { toolDefinitions, executeTool } from "../tools/definitions";

export type AgentResult = {
  ticketId: string;
  status: TicketStatus;
  finalResponse: string;
  toolCallCount: number;
  pendingAction: { id: string; type: string; status: string; amount: number | null } | null;
};

export class AgentError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 500) {
    super(message);
    this.name = "AgentError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function getClientAndModel(): { client: OpenAI; model: string } {
  if (process.env.OPENROUTER_API_KEY) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseURL = "https://openrouter.ai/api/v1";
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
    return {
      client: new OpenAI({ apiKey, baseURL, maxRetries: 0 }),
      model,
    };
  }

  if (process.env.AI_API_KEY) {
    const apiKey = process.env.AI_API_KEY;
    const baseURL = process.env.AI_BASE_URL || undefined;
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    return {
      client: new OpenAI({ apiKey, baseURL, maxRetries: 0 }),
      model,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    return {
      client: new OpenAI({ apiKey, maxRetries: 0 }),
      model,
    };
  }

  throw new AgentError(
    "MODEL_PROVIDER_ERROR",
    "No AI provider API key found (OPENROUTER_API_KEY, AI_API_KEY, or OPENAI_API_KEY)",
    502
  );
}

export async function runAgent(ticketId: string, customerId: string): Promise<AgentResult> {
  // 1. Get the ticket from state.tickets. Assert it exists and is OPEN.
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    throw new AgentError("TICKET_NOT_FOUND", `Ticket ${ticketId} not found`, 404);
  }

  if (ticket.status !== "OPEN") {
    throw new AgentError(
      "INVALID_TICKET_STATE",
      `Ticket ${ticketId} is in status ${ticket.status}, expected OPEN`,
      409
    );
  }

  // 2. Check concurrent run protection: if state.activeRuns.has(ticketId), throw with code 'TICKET_ALREADY_PROCESSING'
  if (state.activeRuns.has(ticketId)) {
    throw new AgentError(
      "TICKET_ALREADY_PROCESSING",
      `Ticket ${ticketId} is already being processed`,
      409
    );
  }

  // 3. Add ticketId to state.activeRuns
  state.activeRuns.add(ticketId);

  // 4. Set ticket status to PROCESSING, update updatedAt
  const now = new Date().toISOString();
  ticket.status = "PROCESSING";
  ticket.updatedAt = now;

  // 5. Create an AgentRun in state.agentRuns (id: 'RUN-' + crypto.randomUUID(), status: 'RUNNING')
  const runId = `RUN-${crypto.randomUUID()}`;
  const run: AgentRun = {
    id: runId,
    ticketId,
    status: "RUNNING",
    toolCallCount: 0,
    startedAt: now,
    completedAt: null,
  };
  state.agentRuns.push(run);

  try {
    const { client, model } = getClientAndModel();

    // 6. Gather all messages for this ticket from state.messages to build conversation history
    const ticketMessages = state.messages
      .filter((m) => m.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 7. Build the system prompt
    const systemPrompt = `You are a customer support agent. You help customers with order issues by investigating their requests using available tools. Always look up relevant information before taking action. If you need more information from the customer, respond with a clear question. Follow company policies strictly. Never make up information - always use tools to verify.

Key Guidelines:
- For replacements, call checkInventory then createReplacement.
- For refunds (regardless of order amount), call createRefundRequest. For orders over ₹2,000, calling createRefundRequest automatically submits the refund for support approval. Do NOT call escalateToHuman for refunds over ₹2,000; call createRefundRequest.
- Only call escalateToHuman when a request cannot be handled by standard policies or tools.
- If you need more information from the customer before you can proceed (such as the specific order ID or details not yet provided), start your response with: NEEDS_INFO:

Context:
- Customer ID: ${customerId || ticket.customerId}
- Ticket ID: ${ticket.id}
- Associated Order ID: ${ticket.orderId || "None"}
- Subject: ${ticket.subject}`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of ticketMessages) {
      if (msg.role === "CUSTOMER") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === "AGENT") {
        messages.push({ role: "assistant", content: msg.content });
      }
    }

    if (ticketMessages.length === 0) {
      messages.push({ role: "user", content: ticket.subject });
    }

    // 8. Call the model in a loop (max 6 tool calls total across all iterations)
    let toolCallCount = 0;
    let sequence = 0;
    let finalResponse = "";
    const failedCalls = new Map<string, number>();
    const effectiveCustomerId = ticket.customerId || customerId;
    let shouldStop = false;

    while (true) {
      let response;
      let lastErr: any = null;
      const MAX_429_ATTEMPTS = 20; // 1 initial attempt + at most 19 retries
      const MAX_OTHER_ATTEMPTS = 3;
      let otherAttempts = 0;

      for (let attempt = 1; attempt <= MAX_429_ATTEMPTS; attempt++) {
        try {
          response = await client.chat.completions.create({
            model,
            messages,
            tools: toolDefinitions as any,
            temperature: 0.1,
          });
          lastErr = null;
          break;
        } catch (providerErr: any) {
          lastErr = providerErr;
          const is429 =
            providerErr?.status === 429 ||
            providerErr?.statusCode === 429 ||
            /429|rate limit/i.test(providerErr?.message || "");

          if (is429) {
            console.error(
              `429 Rate limit exceeded (attempt ${attempt}/${MAX_429_ATTEMPTS}, retried ${attempt - 1} times):`,
              providerErr?.message
            );
            // Retry at most 19 more times (up to attempt 20).
            // On the 20th attempt, if it still fails, stop retrying and pass on the error.
            if (attempt < MAX_429_ATTEMPTS) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            } else {
              console.error(
                `Failed on the 20th attempt with 429 rate limit. Passing on the error.`
              );
              break;
            }
          } else {
            otherAttempts++;
            console.error(
              `Provider error (attempt ${otherAttempts}/${MAX_OTHER_ATTEMPTS}):`,
              providerErr?.status || providerErr?.statusCode,
              providerErr?.message
            );
            if (otherAttempts < MAX_OTHER_ATTEMPTS) {
              await new Promise((resolve) => setTimeout(resolve, 1500 * otherAttempts));
              continue;
            } else {
              break;
            }
          }
        }
      }

      if (lastErr || !response) {
        ticket.status = "FAILED";
        ticket.updatedAt = new Date().toISOString();
        run.status = "FAILED";
        run.completedAt = new Date().toISOString();
        throw new AgentError(
          "MODEL_PROVIDER_ERROR",
          `AI provider error: ${lastErr?.message || String(lastErr)}`,
          502
        );
      }

      const choice = response.choices?.[0];
      if (!choice) {
        ticket.status = "FAILED";
        ticket.updatedAt = new Date().toISOString();
        run.status = "FAILED";
        run.completedAt = new Date().toISOString();
        throw new AgentError("MODEL_PROVIDER_ERROR", "Model provider returned no choices", 502);
      }

      const responseMessage = choice.message;

      // Check if tool_calls returned
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== "function") continue;

          toolCallCount++;
          run.toolCallCount = toolCallCount;

          if (toolCallCount > 6) {
            ticket.status = "FAILED";
            ticket.updatedAt = new Date().toISOString();
            run.status = "FAILED";
            run.completedAt = new Date().toISOString();
            throw new AgentError(
              "AGENT_STEP_LIMIT_EXCEEDED",
              "Agent step limit exceeded",
              500
            );
          }

          sequence++;
          const toolName = toolCall.function.name;
          let args: Record<string, unknown> = {};
          try {
            args = typeof toolCall.function.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : (toolCall.function.arguments as Record<string, unknown>) || {};
          } catch {
            args = {};
          }

          let toolStatus: "SUCCEEDED" | "FAILED" = "SUCCEEDED";
          let toolResult: unknown = null;
          let toolError: unknown = null;

          try {
            const rawResult = await executeTool(toolName, args, {
              ticketId,
              customerId: effectiveCustomerId,
            });

            if (
              rawResult &&
              typeof rawResult === "object" &&
              "error" in rawResult &&
              (rawResult as any).error !== null &&
              (rawResult as any).error !== undefined &&
              !("success" in rawResult && (rawResult as any).success === true)
            ) {
              toolStatus = "FAILED";
              toolError = (rawResult as any).error;
              toolResult = null;
            } else {
              toolStatus = "SUCCEEDED";
              toolResult = rawResult;
              toolError = null;
            }
          } catch (err: any) {
            toolStatus = "FAILED";
            toolError = err?.message || String(err);
            toolResult = null;
          }

          const toolCallRecord: ToolCall = {
            id: `TC-${crypto.randomUUID()}`,
            runId,
            ticketId,
            sequence,
            toolName,
            arguments: args,
            status: toolStatus,
            result: toolResult,
            error: toolError,
            createdAt: new Date().toISOString(),
          };
          state.toolCalls.push(toolCallRecord);

          // Retry / failure tracking:
          if (toolStatus === "FAILED") {
            const failKey = JSON.stringify({ toolName, args });
            const prevCount = failedCalls.get(failKey) ?? 0;
            if (prevCount >= 1) {
              ticket.status = "ESCALATED";
              ticket.escalationReason = `Tool ${toolName} failed repeatedly with identical arguments`;
              ticket.updatedAt = new Date().toISOString();
              shouldStop = true;
              break;
            } else {
              failedCalls.set(failKey, prevCount + 1);
            }
          }

          if (toolName === "escalateToHuman" || ticket.status === "ESCALATED") {
            shouldStop = true;
            break;
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content:
              toolStatus === "SUCCEEDED"
                ? typeof toolResult === "string"
                  ? toolResult
                  : JSON.stringify(toolResult)
                : JSON.stringify({ error: toolError }),
          });
        }

        if (shouldStop) {
          break;
        }
      } else {
        // Model returned text response (no tool_calls)
        finalResponse = responseMessage.content || "";
        break;
      }
    }

    // 9. After the loop:
    let isNeedsInfo = false;
    const needsInfoPrefixMatch = finalResponse.match(/^\[?NEEDS_INFO\]?:?\s*/i);
    if (needsInfoPrefixMatch) {
      finalResponse = finalResponse.slice(needsInfoPrefixMatch[0].length).trim();
      isNeedsInfo = true;
    }

    // Check if any action was created for this ticket with status PENDING
    const pendingActionRecord = state.actions.find(
      (a) => a.ticketId === ticketId && a.status === "PENDING"
    );

    const successfulActionCalls = state.toolCalls.filter(
      (tc) =>
        tc.runId === runId &&
        tc.status === "SUCCEEDED" &&
        ["createReplacement", "createRefundRequest"].includes(tc.toolName)
    );

    if (ticket.status === "ESCALATED") {
      // Keep ESCALATED
    } else if (pendingActionRecord) {
      ticket.status = "AWAITING_APPROVAL";
    } else if (isNeedsInfo) {
      ticket.status = "NEEDS_INFORMATION";
    } else if (
      successfulActionCalls.length === 0 &&
      !ticket.orderId &&
      (finalResponse.includes("?") ||
        /order number|which order|order id|please provide/i.test(finalResponse))
    ) {
      ticket.status = "NEEDS_INFORMATION";
    } else if (ticket.status === "PROCESSING") {
      ticket.status = "RESOLVED";
    }

    if (!finalResponse) {
      if (ticket.status === "ESCALATED") {
        finalResponse = ticket.escalationReason
          ? `This ticket has been escalated to human support: ${ticket.escalationReason}`
          : "This ticket has been escalated to human support.";
      } else if (ticket.status === "AWAITING_APPROVAL") {
        finalResponse = "Your request has been submitted and is awaiting support approval.";
      } else if (ticket.status === "NEEDS_INFORMATION") {
        finalResponse = "Please provide additional information so we can assist you.";
      } else {
        finalResponse = "Your request has been processed.";
      }
    }

    // Store the final response as an AGENT message in state.messages
    const agentMessage: Message = {
      id: `MSG-${crypto.randomUUID()}`,
      ticketId,
      role: "AGENT",
      content: finalResponse,
      createdAt: new Date().toISOString(),
    };
    state.messages.push(agentMessage);

    ticket.finalResponse = finalResponse;
    ticket.updatedAt = new Date().toISOString();

    run.status = "COMPLETED";
    run.completedAt = new Date().toISOString();

    const pendingAction = pendingActionRecord
      ? {
          id: pendingActionRecord.id,
          type: pendingActionRecord.type,
          status: pendingActionRecord.status,
          amount: pendingActionRecord.amount,
        }
      : null;

    return {
      ticketId: ticket.id,
      status: ticket.status,
      finalResponse,
      toolCallCount,
      pendingAction,
    };
  } finally {
    // 10. Always remove ticketId from state.activeRuns in a `finally` block
    state.activeRuns.delete(ticketId);
    if (!run.completedAt) {
      run.completedAt = new Date().toISOString();
    }
  }
}
