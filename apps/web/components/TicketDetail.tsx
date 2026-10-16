"use client";
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  User as UserIcon,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Terminal,
  MessageSquare,
  Package,
} from "lucide-react";
import {
  api,
  type TicketDetailResponse,
  type User as UserType,
} from "@/lib/api";
import { StatusBadge } from "@/lib/../components/ui/badge";
import { ToolCallsViewer } from "./ToolCallsViewer";
import { ApprovalModal } from "./ApprovalModal";
import { EscalateModal } from "./EscalateModal";

export const TicketDetail = ({
  ticketId,
  currentUser,
  onTicketUpdated,
}: {
  ticketId: string;
  currentUser: UserType | null;
  onTicketUpdated: () => void;
}) => {
  const [detail, setDetail] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "tools">("chat");

  // Running agent state
  const [runningAgent, setRunningAgent] = useState(false);

  // New message state
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Modals
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      const data = await api.getTicket(ticketId);
      setDetail(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      setLoading(true);
      fetchDetail();
    }
  }, [ticketId]);

  const handleRunAgent = async () => {
    setRunningAgent(true);
    try {
      await api.runAgent(ticketId);
      await fetchDetail();
      onTicketUpdated();
      setActiveTab("tools");
    } catch (err: any) {
      alert("Agent run error: " + (err?.message || "Error occurred"));
      await fetchDetail();
      onTicketUpdated();
    } finally {
      setRunningAgent(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSendingReply(true);
    try {
      await api.addMessage(ticketId, replyContent.trim());
      setReplyContent("");
      await fetchDetail();
      onTicketUpdated();
    } catch (err: any) {
      alert("Failed to send reply: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading ticket detail...</span>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-rose-200">Unable to load ticket</h4>
          <p className="text-xs text-rose-300/80 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { ticket, messages, toolCalls, pendingAction } = detail;
  const isOwner = currentUser?.id === ticket.customerId;
  const isSupport = currentUser?.role === "SUPPORT";
  const canRunAgent = ticket.status === "OPEN";
  const canReply =
    isOwner && (ticket.status === "OPEN" || ticket.status === "NEEDS_INFORMATION");
  const canEscalate =
    isSupport &&
    (ticket.status === "OPEN" ||
      ticket.status === "NEEDS_INFORMATION" ||
      ticket.status === "AWAITING_APPROVAL");
  const canApprove = isSupport && ticket.status === "AWAITING_APPROVAL";

  return (
    <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400">
                {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              {ticket.orderId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-blue-400 border border-slate-700">
                  <Package className="w-3 h-3" />
                  {ticket.orderId}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {ticket.subject}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Customer: <span className="font-mono text-slate-300">{ticket.customerId}</span></span>
              <span>•</span>
              <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {canRunAgent && (
              <button
                type="button"
                disabled={runningAgent}
                onClick={handleRunAgent}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${runningAgent ? "animate-spin" : ""}`} />
                <span>{runningAgent ? "Agent Running..." : "Run AI Agent"}</span>
              </button>
            )}

            {canApprove && (
              <button
                type="button"
                onClick={() => setIsApprovalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Review Approval</span>
              </button>
            )}

            {canEscalate && (
              <button
                type="button"
                onClick={() => setIsEscalateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                <span>Escalate</span>
              </button>
            )}
          </div>
        </div>

        {/* Pending Action Banner */}
        {pendingAction && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-white">
                  Action Pending Approval:{" "}
                </span>
                <span className="text-amber-300 font-mono">
                  {pendingAction.type} of ₹{pendingAction.amount?.toLocaleString() ?? "N/A"}
                </span>
                <span className="text-slate-400 ml-1.5 hidden sm:inline">
                  (Requires support tier authorization under refund policy)
                </span>
              </div>
            </div>
            {isSupport && (
              <button
                onClick={() => setIsApprovalOpen(true)}
                className="text-xs font-semibold text-amber-300 hover:text-white underline whitespace-nowrap"
              >
                Take Decision →
              </button>
            )}
          </div>
        )}

        {/* Escalation Reason Banner */}
        {ticket.status === "ESCALATED" && ticket.escalationReason && (
          <div className="mt-4 p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="text-xs text-orange-200">
              <span className="font-bold">Escalated to Human Support:</span>{" "}
              {ticket.escalationReason}
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-4 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/20 text-xs">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1.5 pb-2.5 font-semibold transition border-b-2 ${
            activeTab === "chat"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Messages & Conversation</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
            {messages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tools")}
          className={`flex items-center gap-1.5 pb-2.5 font-semibold transition border-b-2 ${
            activeTab === "tools"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Agent Tool Execution Trace</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {toolCalls.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
        {activeTab === "chat" ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => {
              const isAgent = msg.role === "AGENT";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isAgent ? "items-start" : "items-start flex-row-reverse"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                      isAgent
                        ? "bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-blue-500/20"
                        : "bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/20"
                    }`}
                  >
                    {isAgent ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isAgent
                        ? "bg-slate-950 border border-slate-800 text-slate-200"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="font-bold text-[11px] opacity-80">
                        {isAgent ? "AI Customer Support Agent" : "Customer"}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {/* If agent is actively running, show typing pulse */}
            {runningAgent && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl p-4 bg-slate-950 border border-blue-500/30 text-xs text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Agent is investigating order, checking policies & inventory...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <ToolCallsViewer toolCalls={toolCalls} />
          </div>
        )}
      </div>

      {/* Reply input for Customer */}
      {canReply && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <form onSubmit={handleSendReply} className="flex gap-2">
            <input
              type="text"
              placeholder={
                ticket.status === "NEEDS_INFORMATION"
                  ? "Provide the requested details (e.g. order number ORD-1001)..."
                  : "Type a follow-up message..."
              }
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={sendingReply}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={sendingReply || !replyContent.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Modals */}
      <ApprovalModal
        isOpen={isApprovalOpen}
        ticketId={ticket.id}
        pendingAction={pendingAction}
        onClose={() => setIsApprovalOpen(false)}
        onResolved={() => {
          fetchDetail();
          onTicketUpdated();
        }}
      />

      <EscalateModal
        isOpen={isEscalateOpen}
        ticketId={ticket.id}
        onClose={() => setIsEscalateOpen(false)}
        onEscalated={() => {
          fetchDetail();
          onTicketUpdated();
        }}
      />
    </div>
  );
};
