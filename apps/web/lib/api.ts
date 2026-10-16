export type UserRole = "CUSTOMER" | "SUPPORT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type TicketStatus =
  | "OPEN"
  | "PROCESSING"
  | "NEEDS_INFORMATION"
  | "AWAITING_APPROVAL"
  | "RESOLVED"
  | "ESCALATED"
  | "FAILED";

export type Ticket = {
  id: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  status: TicketStatus;
  finalResponse: string | null;
  escalationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  ticketId: string;
  role: "CUSTOMER" | "AGENT";
  content: string;
  createdAt: string;
};

export type ToolCall = {
  id: string;
  runId: string;
  ticketId: string;
  sequence: number;
  toolName: string;
  arguments: Record<string, any>;
  status: "SUCCEEDED" | "FAILED";
  result: any;
  error: any;
  createdAt: string;
};

export type PendingAction = {
  id: string;
  type: "REFUND" | "REPLACEMENT";
  status: "PENDING" | "COMPLETED" | "REJECTED";
  amount: number | null;
};

export type TicketDetailResponse = {
  ticket: Ticket;
  messages: Message[];
  toolCalls: ToolCall[];
  pendingAction: PendingAction | null;
};

const TOKEN_KEY = "s30_auth_token";
const USER_KEY = "s30_auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
    const code = data?.error?.code || "ERROR";
    const err = new Error(errorMsg) as Error & { code?: string; status?: number };
    err.code = code;
    err.status = res.status;
    throw err;
  }

  return data.data as T;
}

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async getTickets(status?: string): Promise<{ tickets: Ticket[] }> {
    const query = status && status !== "ALL" ? `?status=${status}` : "";
    return request<{ tickets: Ticket[] }>(`/api/tickets${query}`);
  },

  async getTicket(ticketId: string): Promise<TicketDetailResponse> {
    return request<TicketDetailResponse>(`/api/tickets/${ticketId}`);
  },

  async createTicket(input: { orderId?: string; subject: string; message: string }): Promise<Ticket> {
    return request<Ticket>("/api/tickets", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async addMessage(ticketId: string, content: string): Promise<{ message: Message; ticketStatus: TicketStatus }> {
    return request<{ message: Message; ticketStatus: TicketStatus }>(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  async runAgent(ticketId: string): Promise<{
    ticketId: string;
    status: TicketStatus;
    finalResponse: string;
    toolCallCount: number;
    pendingAction: PendingAction | null;
  }> {
    return request<{
      ticketId: string;
      status: TicketStatus;
      finalResponse: string;
      toolCallCount: number;
      pendingAction: PendingAction | null;
    }>(`/api/tickets/${ticketId}/run`, {
      method: "POST",
    });
  },

  async approve(ticketId: string, decision: "APPROVED" | "REJECTED", note?: string): Promise<{
    ticketId: string;
    status: TicketStatus;
    action: PendingAction;
  }> {
    return request<{
      ticketId: string;
      status: TicketStatus;
      action: PendingAction;
    }>(`/api/tickets/${ticketId}/approval`, {
      method: "POST",
      body: JSON.stringify({ decision, note }),
    });
  },

  async escalate(ticketId: string, reason: string): Promise<{
    ticketId: string;
    status: "ESCALATED";
    escalationReason: string;
  }> {
    return request<{
      ticketId: string;
      status: "ESCALATED";
      escalationReason: string;
    }>(`/api/tickets/${ticketId}/escalate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async health(): Promise<{ status: string }> {
    return request<{ status: string }>("/health");
  },
};
