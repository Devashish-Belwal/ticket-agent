"use client";
import React, { useState } from "react";
import { X, Sparkles, AlertCircle, Package, Send, Zap } from "lucide-react";
import { api, type Ticket } from "@/lib/api";

const PRESET_SCENARIOS = [
  {
    title: "Keyboard Damaged (Replacement)",
    orderId: "ORD-1001",
    subject: "Keyboard arrived damaged with broken keys",
    message:
      "Order ORD-1001 was delivered three days ago with broken keys. Please inspect the order, policy, and inventory and create a replacement.",
    tag: "Auto-Replace (Stock: 10)",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    title: "Headphones Faulty (₹4,999 Refund)",
    orderId: "ORD-1002",
    subject: "Refund faulty wireless headphones",
    message:
      "The headphones in delivered order ORD-1002 are faulty. I want a refund, not a replacement. Check the refund policy and create the refund request.",
    tag: "High-Value (>₹2,000 Approval)",
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  {
    title: "Damaged Item (Unknown Order ID)",
    orderId: "",
    subject: "Damaged item but order unknown",
    message:
      "A delivered item is damaged, but I do not know which of my orders it came from. Please ask me for the order number before acting.",
    tag: "Triggers NEEDS_INFORMATION",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    title: "Keyboard Auto-Refund (₹1,500)",
    orderId: "ORD-1001",
    subject: "Refund the damaged keyboard",
    message:
      "The keyboard in delivered order ORD-1001 is damaged. I want a refund, not a replacement. Create the refund request under the policy.",
    tag: "Auto-Refund (≤₹2,000)",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
];

export const NewTicketModal = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}) => {
  const [orderId, setOrderId] = useState("ORD-1001");
  const [subject, setSubject] = useState("Keyboard arrived damaged with broken keys");
  const [message, setMessage] = useState(
    "Order ORD-1001 was delivered three days ago with broken keys. Please inspect the order, policy, and inventory and create a replacement."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (scenario: typeof PRESET_SCENARIOS[0]) => {
    setOrderId(scenario.orderId);
    setSubject(scenario.subject);
    setMessage(scenario.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ticket = await api.createTicket({
        orderId: orderId.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      onCreated(ticket);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Create Support Ticket
              </h3>
              <p className="text-xs text-slate-400">
                Submit an issue for the AI customer support agent to investigate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-y-auto flex-1 pr-1 space-y-6">
          {/* Quick presets */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Test Scenarios (1-Click Fill)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.title}
                  type="button"
                  onClick={() => handleApplyPreset(scenario)}
                  className="text-left p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition">
                      {scenario.title}
                    </span>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${scenario.color}`}
                  >
                    {scenario.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Order ID <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ORD-1001, ORD-1002, ORD-1003 (or leave empty)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Subject <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {subject.length}/120 chars (min 5)
                </span>
              </div>
              <input
                type="text"
                placeholder="Brief summary of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                minLength={5}
                maxLength={120}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Message Description <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {message.length}/2000 chars (min 10)
                </span>
              </div>
              <textarea
                rows={4}
                placeholder="Explain what happened with your order..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minLength={10}
                maxLength={2000}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Submitting..." : "Submit Ticket"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
