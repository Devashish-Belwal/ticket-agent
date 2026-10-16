import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import {
  state,
  type Approval,
  type Message,
  type Ticket,
  type TicketStatus,
} from "../state";
import { authenticate, requireRole, getUser } from "../middleware/auth";
import { runAgent } from "../agent/agent";

const router = Router();

// All routes use the authenticate middleware
router.use(authenticate);

const VALID_TICKET_STATUSES: readonly TicketStatus[] = [
  "OPEN",
  "PROCESSING",
  "NEEDS_INFORMATION",
  "AWAITING_APPROVAL",
  "RESOLVED",
  "ESCALATED",
  "FAILED",
] as const;

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({
    success: false,
    error: { code, message },
  });
}

function getTicketIdParam(req: Request): string {
  const param = req.params.ticketId;
  if (typeof param === "string") return param;
  if (Array.isArray(param) && typeof param[0] === "string") return param[0];
  return "";
}

/**
 * POST /
 * Create ticket (Customer only)
 */
router.post(
  "/",
  requireRole("CUSTOMER"),
  (req: Request, res: Response): void => {
    const user = getUser(req);
    if (!user) {
      sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const body = req.body;
    if (!body || typeof body !== "object") {
      sendError(res, 400, "VALIDATION_ERROR", "Request body must be a JSON object");
      return;
    }

    const { orderId, subject, message } = body as {
      orderId?: unknown;
      subject?: unknown;
      message?: unknown;
    };

    if (
      typeof subject !== "string" ||
      subject.length < 5 ||
      subject.length > 120
    ) {
      sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Subject must be between 5 and 120 characters",
      );
      return;
    }

    if (
      typeof message !== "string" ||
      message.length < 10 ||
      message.length > 2000
    ) {
      sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Message must be between 10 and 2000 characters",
      );
      return;
    }

    let resolvedOrderId: string | null = null;
    if (orderId !== undefined && orderId !== null && orderId !== "") {
      if (typeof orderId !== "string") {
        sendError(res, 400, "VALIDATION_ERROR", "orderId must be a string");
        return;
      }
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) {
        sendError(res, 404, "ORDER_NOT_FOUND", "Order not found");
        return;
      }
      if (order.customerId !== user.id) {
        sendError(
          res,
          403,
          "ORDER_ACCESS_DENIED",
          "Order does not belong to the authenticated customer",
        );
        return;
      }
      resolvedOrderId = order.id;
    }

    const now = new Date().toISOString();
    const ticketId = `TKT-${randomUUID()}`;
    const initialMessageId = `MSG-${randomUUID()}`;

    const newTicket: Ticket = {
      id: ticketId,
      customerId: user.id,
      orderId: resolvedOrderId,
      subject,
      status: "OPEN",
      finalResponse: null,
      escalationReason: null,
      createdAt: now,
      updatedAt: now,
    };

    const initialMessage: Message = {
      id: initialMessageId,
      ticketId,
      role: "CUSTOMER",
      content: message,
      createdAt: now,
    };

    state.tickets.push(newTicket);
    state.messages.push(initialMessage);

    res.status(201).json({
      success: true,
      data: {
        id: newTicket.id,
        customerId: newTicket.customerId,
        orderId: newTicket.orderId,
        subject: newTicket.subject,
        status: newTicket.status,
        createdAt: newTicket.createdAt,
        updatedAt: newTicket.updatedAt,
      },
    });
  },
);

/**
 * GET /
 * List tickets (Customer sees own, Support sees all)
 */
router.get("/", (req: Request, res: Response): void => {
  const user = getUser(req);
  if (!user) {
    sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    return;
  }

  const { status } = req.query;
  if (status !== undefined && status !== "") {
    if (
      typeof status !== "string" ||
      !VALID_TICKET_STATUSES.includes(status as TicketStatus)
    ) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid ticket status filter");
      return;
    }
  }

  let tickets =
    user.role === "CUSTOMER"
      ? state.tickets.filter((t) => t.customerId === user.id)
      : [...state.tickets];

  if (typeof status === "string" && status !== "") {
    tickets = tickets.filter((t) => t.status === status);
  }

  tickets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  res.status(200).json({
    success: true,
    data: {
      tickets,
    },
  });
});

/**
 * GET /:ticketId
 * Get ticket details, messages, tool calls, and pending action
 */
router.get("/:ticketId", (req: Request, res: Response): void => {
  const user = getUser(req);
  if (!user) {
    sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    return;
  }

  const ticketId = getTicketIdParam(req);
  if (!ticketId) {
    sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
    return;
  }

  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
    return;
  }

  if (user.role === "CUSTOMER" && ticket.customerId !== user.id) {
    sendError(
      res,
      403,
      "TICKET_ACCESS_DENIED",
      "Access denied to this ticket",
    );
    return;
  }

  const messages = state.messages
    .filter((m) => m.ticketId === ticket.id)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const toolCalls = state.toolCalls
    .filter((tc) => tc.ticketId === ticket.id)
    .sort(
      (a, b) =>
        a.sequence - b.sequence ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const pendingAction = state.actions.find(
    (a) => a.ticketId === ticket.id && a.status === "PENDING",
  );

  res.status(200).json({
    success: true,
    data: {
      ticket: {
        id: ticket.id,
        customerId: ticket.customerId,
        orderId: ticket.orderId,
        subject: ticket.subject,
        status: ticket.status,
        finalResponse: ticket.finalResponse,
        escalationReason: ticket.escalationReason,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
      messages,
      toolCalls,
      pendingAction: pendingAction
        ? {
            id: pendingAction.id,
            type: pendingAction.type,
            status: pendingAction.status,
            amount: pendingAction.amount,
          }
        : null,
    },
  });
});

/**
 * POST /:ticketId/messages
 * Add a customer message to a ticket
 */
router.post("/:ticketId/messages", (req: Request, res: Response): void => {
  const user = getUser(req);
  if (!user) {
    sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    return;
  }

  const ticketId = getTicketIdParam(req);
  if (!ticketId) {
    sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
    return;
  }

  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
    return;
  }

  if (user.role !== "CUSTOMER") {
    sendError(
      res,
      403,
      "TICKET_ACCESS_DENIED",
      "Only customers can post messages through this route",
    );
    return;
  }

  if (ticket.customerId !== user.id) {
    sendError(
      res,
      403,
      "TICKET_ACCESS_DENIED",
      "Access denied to this ticket",
    );
    return;
  }

  if (ticket.status !== "OPEN" && ticket.status !== "NEEDS_INFORMATION") {
    sendError(
      res,
      409,
      "INVALID_TICKET_STATE",
      "Ticket is not in an editable state",
    );
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    sendError(res, 400, "VALIDATION_ERROR", "Request body must be a JSON object");
    return;
  }

  const { content } = body as { content?: unknown };
  if (typeof content !== "string") {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Content must be a string",
    );
    return;
  }

  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Content must be between 1 and 2000 characters",
    );
    return;
  }

  const now = new Date().toISOString();
  if (ticket.status === "NEEDS_INFORMATION") {
    ticket.status = "OPEN";
    ticket.updatedAt = now;
  }

  const message: Message = {
    id: `MSG-${randomUUID()}`,
    ticketId: ticket.id,
    role: "CUSTOMER",
    content: trimmed,
    createdAt: now,
  };

  state.messages.push(message);

  res.status(201).json({
    success: true,
    data: {
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      },
      ticketStatus: ticket.status,
    },
  });
});

/**
 * POST /:ticketId/run
 * Run the agent for an OPEN ticket
 */
router.post(
  "/:ticketId/run",
  async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    if (!user) {
      sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const ticketId = getTicketIdParam(req);
    if (!ticketId) {
      sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
      return;
    }

    const ticket = state.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
      return;
    }

    if (user.role === "CUSTOMER" && ticket.customerId !== user.id) {
      sendError(
        res,
        403,
        "TICKET_ACCESS_DENIED",
        "Access denied to this ticket",
      );
      return;
    }

    if (ticket.status !== "OPEN") {
      sendError(
        res,
        409,
        "INVALID_TICKET_STATE",
        "Ticket is not in OPEN status",
      );
      return;
    }

    if (state.activeRuns.has(ticketId)) {
      sendError(
        res,
        409,
        "TICKET_ALREADY_PROCESSING",
        "Ticket is already processing",
      );
      return;
    }

    try {
      const agentResult = await runAgent(ticketId, ticket.customerId);

      const pendingAction =
        agentResult?.pendingAction !== undefined
          ? agentResult.pendingAction
          : (() => {
              const action = state.actions.find(
                (a) => a.ticketId === ticket.id && a.status === "PENDING",
              );
              return action
                ? {
                    id: action.id,
                    type: action.type,
                    status: action.status,
                    amount: action.amount,
                  }
                : null;
            })();

      res.status(200).json({
        success: true,
        data: {
          ticketId: agentResult?.ticketId ?? ticket.id,
          status: agentResult?.status ?? ticket.status,
          finalResponse: agentResult?.finalResponse ?? ticket.finalResponse,
          toolCallCount: agentResult?.toolCallCount ?? 0,
          pendingAction,
        },
      });
    } catch (error: any) {
      if (error?.code === "MODEL_PROVIDER_ERROR") {
        sendError(
          res,
          502,
          "MODEL_PROVIDER_ERROR",
          error.message || "Model provider error",
        );
        return;
      }
      if (error?.code === "AGENT_STEP_LIMIT_EXCEEDED") {
        sendError(
          res,
          500,
          "AGENT_STEP_LIMIT_EXCEEDED",
          error.message || "Agent step limit exceeded",
        );
        return;
      }
      if (error?.code === "TICKET_ALREADY_PROCESSING") {
        sendError(
          res,
          409,
          "TICKET_ALREADY_PROCESSING",
          error.message || "Ticket is already processing",
        );
        return;
      }
      sendError(
        res,
        500,
        error?.code || "INTERNAL_ERROR",
        error?.message || "An unexpected error occurred",
      );
    }
  },
);

/**
 * POST /:ticketId/approval
 * Approve or reject a pending action for a ticket (Support only)
 */
router.post(
  "/:ticketId/approval",
  requireRole("SUPPORT"),
  (req: Request, res: Response): void => {
    const user = getUser(req);
    if (!user) {
      sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const ticketId = getTicketIdParam(req);
    if (!ticketId) {
      sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
      return;
    }

    const ticket = state.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
      return;
    }

    if (ticket.status !== "AWAITING_APPROVAL") {
      sendError(
        res,
        409,
        "NO_PENDING_APPROVAL",
        "Ticket is not awaiting approval",
      );
      return;
    }

    const body = req.body;
    if (!body || typeof body !== "object") {
      sendError(res, 400, "VALIDATION_ERROR", "Request body must be a JSON object");
      return;
    }

    const { decision, note } = body as { decision?: unknown; note?: unknown };
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Decision must be APPROVED or REJECTED",
      );
      return;
    }

    if (note !== undefined && note !== null) {
      if (typeof note !== "string" || note.length > 500) {
        sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Note must be a string of at most 500 characters",
        );
        return;
      }
    }

    const action = state.actions.find(
      (a) => a.ticketId === ticket.id && a.status === "PENDING",
    );
    if (!action) {
      sendError(
        res,
        409,
        "NO_PENDING_APPROVAL",
        "No pending action found for this ticket",
      );
      return;
    }

    const now = new Date().toISOString();
    action.updatedAt = now;
    ticket.updatedAt = now;

    const trimmedNote = typeof note === "string" ? note.trim() : "";

    if (decision === "APPROVED") {
      action.status = "COMPLETED";
      ticket.status = "RESOLVED";
    } else {
      action.status = "REJECTED";
      ticket.status = "ESCALATED";
      ticket.escalationReason =
        trimmedNote.length > 0 ? trimmedNote : "Approval rejected by support";
    }

    const approval: Approval = {
      id: `APR-${randomUUID()}`,
      ticketId: ticket.id,
      actionId: action.id,
      supportUserId: user.id,
      decision,
      note: trimmedNote.length > 0 ? trimmedNote : null,
      createdAt: now,
    };
    state.approvals.push(approval);

    res.status(200).json({
      success: true,
      data: {
        ticketId: ticket.id,
        status: ticket.status,
        action: {
          id: action.id,
          type: action.type,
          status: action.status,
          amount: action.amount,
        },
      },
    });
  },
);

/**
 * POST /:ticketId/escalate
 * Manually escalate a ticket to human support (Support only)
 */
router.post(
  "/:ticketId/escalate",
  requireRole("SUPPORT"),
  (req: Request, res: Response): void => {
    const user = getUser(req);
    if (!user) {
      sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    const ticketId = getTicketIdParam(req);
    if (!ticketId) {
      sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
      return;
    }

    const ticket = state.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      sendError(res, 404, "TICKET_NOT_FOUND", "Ticket not found");
      return;
    }

    const body = req.body;
    if (!body || typeof body !== "object") {
      sendError(res, 400, "VALIDATION_ERROR", "Request body must be a JSON object");
      return;
    }

    const { reason } = body as { reason?: unknown };
    if (typeof reason !== "string") {
      sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Reason must be a string",
      );
      return;
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Reason must be between 10 and 500 characters",
      );
      return;
    }

    const allowedStatuses: TicketStatus[] = [
      "OPEN",
      "NEEDS_INFORMATION",
      "AWAITING_APPROVAL",
    ];
    if (!allowedStatuses.includes(ticket.status)) {
      sendError(
        res,
        409,
        "INVALID_TICKET_STATE",
        "Ticket cannot be escalated from current state",
      );
      return;
    }

    const now = new Date().toISOString();
    const pendingAction = state.actions.find(
      (a) => a.ticketId === ticket.id && a.status === "PENDING",
    );
    if (pendingAction) {
      pendingAction.status = "REJECTED";
      pendingAction.updatedAt = now;
    }

    ticket.status = "ESCALATED";
    ticket.escalationReason = trimmedReason;
    ticket.updatedAt = now;

    res.status(200).json({
      success: true,
      data: {
        ticketId: ticket.id,
        status: "ESCALATED",
        escalationReason: trimmedReason,
      },
    });
  },
);

export default router;
