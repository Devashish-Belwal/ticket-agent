import { state, type Action } from "../state";

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "getOrder",
      description:
        "Looks up an order by ID. Must verify the order belongs to the customer. Returns order details and product information.",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "The unique ID of the order to look up.",
          },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCustomerOrders",
      description: "Returns all orders belonging to the ticket's customer.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchPolicies",
      description:
        "Searches company policies by matching a query against policy title and content (case-insensitive).",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keywords or phrase to match against policy titles and contents.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkInventory",
      description: "Returns the current inventory stock level for a product.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The product ID to check stock for.",
          },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createReplacement",
      description:
        "Creates a replacement action for a delivered order within 7 days of delivery if replacement stock is available.",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "The ID of the delivered order to replace.",
          },
          reason: {
            type: "string",
            description: "The reason for the replacement request.",
          },
        },
        required: ["orderId", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createRefundRequest",
      description:
        "Creates a refund action for a delivered order within 30 days of delivery. Always use this tool for refund requests, including high-value refunds above ₹2,000 (this tool automatically creates a pending approval for support). Do NOT call escalateToHuman for refunds above ₹2,000.",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "The ID of the delivered order to refund.",
          },
          reason: {
            type: "string",
            description: "The reason for the refund request.",
          },
        },
        required: ["orderId", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalateToHuman",
      description: "Escalates the ticket to human customer support with a specific reason.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "The reason for escalating to human support.",
          },
        },
        required: ["reason"],
      },
    },
  },
];

export interface ToolExecutionContext {
  ticketId: string;
  customerId: string;
}

export function executeTool(
  toolName: string,
  args: any,
  context: ToolExecutionContext
): Record<string, any> {
  try {
    let parsedArgs = args;
    if (typeof args === "string") {
      try {
        parsedArgs = JSON.parse(args);
      } catch {
        return { error: "Invalid tool arguments JSON" };
      }
    }
    if (!parsedArgs || typeof parsedArgs !== "object") {
      parsedArgs = {};
    }

    switch (toolName) {
      case "getOrder": {
        const orderId = parsedArgs.orderId;
        if (!orderId || typeof orderId !== "string") {
          return { error: "orderId is required" };
        }
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) {
          return { error: `Order ${orderId} not found` };
        }
        if (order.customerId !== context.customerId) {
          return { error: "ORDER_ACCESS_DENIED" };
        }
        const product = state.products.find((p) => p.id === order.productId) ?? null;
        return {
          ...order,
          order,
          product,
        };
      }

      case "getCustomerOrders": {
        const orders = state.orders
          .filter((o) => o.customerId === context.customerId)
          .map((order) => {
            const product = state.products.find((p) => p.id === order.productId) ?? null;
            return {
              ...order,
              product,
            };
          });
        return { orders };
      }

      case "searchPolicies": {
        const query = parsedArgs.query;
        if (typeof query !== "string" || !query.trim()) {
          return { error: "query is required" };
        }
        const q = query.toLowerCase().trim();
        const words = q.split(/\s+/).filter(Boolean);

        const matchingPolicies = state.policies.filter((policy) => {
          const title = policy.title.toLowerCase();
          const content = policy.content.toLowerCase();
          if (title.includes(q) || content.includes(q)) {
            return true;
          }
          if (words.length > 1) {
            return words.some((w) => title.includes(w) || content.includes(w));
          }
          return false;
        });

        return { policies: matchingPolicies };
      }

      case "checkInventory": {
        const productId = parsedArgs.productId;
        if (!productId || typeof productId !== "string") {
          return { error: "productId is required" };
        }
        const item = state.inventory.find((i) => i.productId === productId);
        if (!item) {
          return { error: `Product ${productId} not found in inventory` };
        }
        return {
          productId: item.productId,
          stock: item.stock,
        };
      }

      case "createReplacement": {
        const orderId = parsedArgs.orderId;
        const reason = parsedArgs.reason;
        if (!orderId || typeof orderId !== "string") {
          return { error: "orderId is required" };
        }
        if (!reason || typeof reason !== "string") {
          return { error: "reason is required" };
        }

        const order = state.orders.find((o) => o.id === orderId);
        if (!order) {
          return { error: `Order ${orderId} not found` };
        }
        if (order.customerId !== context.customerId) {
          return { error: "ORDER_ACCESS_DENIED" };
        }
        if (order.status !== "DELIVERED") {
          return { error: `Order is not delivered (status: ${order.status})` };
        }
        if (
          !order.deliveredAt ||
          !(Date.now() - Date.parse(order.deliveredAt) <= 7 * 24 * 60 * 60 * 1000)
        ) {
          return { error: "Replacement must be requested within 7 days of delivery" };
        }

        // Check for existing action on this order
        const existingAction = state.actions.find(
          (a) => a.orderId === order.id && (a.status === "COMPLETED" || a.status === "PENDING")
        );

        if (existingAction) {
          if (
            existingAction.ticketId === context.ticketId &&
            existingAction.orderId === order.id &&
            existingAction.type === "REPLACEMENT"
          ) {
            return {
              success: true,
              action: existingAction,
              ...existingAction,
            };
          }
          if (existingAction.type !== "REPLACEMENT") {
            return { error: `An action of type ${existingAction.type} already exists for this order` };
          }
          return { error: "An action already exists for this order" };
        }

        const differentAction = state.actions.find(
          (a) => a.orderId === order.id && a.type !== "REPLACEMENT"
        );
        if (differentAction) {
          return { error: `An action of type ${differentAction.type} already exists for this order` };
        }

        const inventoryItem = state.inventory.find((i) => i.productId === order.productId);
        if (!inventoryItem || inventoryItem.stock <= 0) {
          return { error: "Product is out of stock" };
        }

        // Synchronous validation and mutation: no await between check and mutation
        inventoryItem.stock -= 1;

        const now = new Date().toISOString();
        const action: Action = {
          id: `ACT-${crypto.randomUUID()}`,
          ticketId: context.ticketId,
          orderId: order.id,
          type: "REPLACEMENT",
          status: "COMPLETED",
          amount: null,
          reason,
          createdAt: now,
          updatedAt: now,
        };
        state.actions.push(action);

        return {
          success: true,
          action,
          ...action,
        };
      }

      case "createRefundRequest": {
        const orderId = parsedArgs.orderId;
        const reason = parsedArgs.reason;
        if (!orderId || typeof orderId !== "string") {
          return { error: "orderId is required" };
        }
        if (!reason || typeof reason !== "string") {
          return { error: "reason is required" };
        }

        const order = state.orders.find((o) => o.id === orderId);
        if (!order) {
          return { error: `Order ${orderId} not found` };
        }
        if (order.customerId !== context.customerId) {
          return { error: "ORDER_ACCESS_DENIED" };
        }
        if (order.status !== "DELIVERED") {
          return { error: `Order is not delivered (status: ${order.status})` };
        }
        if (
          !order.deliveredAt ||
          !(Date.now() - Date.parse(order.deliveredAt) <= 30 * 24 * 60 * 60 * 1000)
        ) {
          return { error: "Refund must be requested within 30 days of delivery" };
        }

        // Check for existing action on this order
        const existingAction = state.actions.find(
          (a) => a.orderId === order.id && (a.status === "COMPLETED" || a.status === "PENDING")
        );

        if (existingAction) {
          if (
            existingAction.ticketId === context.ticketId &&
            existingAction.orderId === order.id &&
            existingAction.type === "REFUND"
          ) {
            return {
              success: true,
              action: existingAction,
              ...existingAction,
            };
          }
          if (existingAction.type !== "REFUND") {
            return { error: `An action of type ${existingAction.type} already exists for this order` };
          }
          return { error: "An action already exists for this order" };
        }

        const differentAction = state.actions.find(
          (a) => a.orderId === order.id && a.type !== "REFUND"
        );
        if (differentAction) {
          return { error: `An action of type ${differentAction.type} already exists for this order` };
        }

        const product = state.products.find((p) => p.id === order.productId);
        if (!product) {
          return { error: `Product ${order.productId} not found` };
        }

        const price = product.price;
        const status: "PENDING" | "COMPLETED" = price > 2000 ? "PENDING" : "COMPLETED";

        // Synchronous validation and mutation: no await between check and mutation
        const now = new Date().toISOString();
        const action: Action = {
          id: `ACT-${crypto.randomUUID()}`,
          ticketId: context.ticketId,
          orderId: order.id,
          type: "REFUND",
          status,
          amount: price,
          reason,
          createdAt: now,
          updatedAt: now,
        };
        state.actions.push(action);

        const ticket = state.tickets.find((t) => t.id === context.ticketId);
        if (ticket && status === "PENDING") {
          ticket.status = "AWAITING_APPROVAL";
          ticket.updatedAt = now;
        }

        return {
          success: true,
          action,
          ...action,
        };
      }

      case "escalateToHuman": {
        const reason = parsedArgs.reason;
        if (!reason || typeof reason !== "string") {
          return { error: "reason is required" };
        }

        const ticket = state.tickets.find((t) => t.id === context.ticketId);
        if (ticket) {
          ticket.status = "ESCALATED";
          ticket.escalationReason = reason;
          ticket.updatedAt = new Date().toISOString();
        }

        return {
          success: true,
          ticketId: context.ticketId,
          status: "ESCALATED",
          escalationReason: reason,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    return { error: err?.message || "Tool execution failed" };
  }
}
