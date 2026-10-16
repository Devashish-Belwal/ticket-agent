"use client";
import React, { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";
import { api } from "@/lib/api";

export const EscalateModal = ({
  isOpen,
  ticketId,
  onClose,
  onEscalated,
}: {
  isOpen: boolean;
  ticketId: string;
  onClose: () => void;
  onEscalated: () => void;
}) => {
  const [reason, setReason] = useState("Issue requires manual review.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.escalate(ticketId, reason.trim());
      onEscalated();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to escalate ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Escalate to Human
              </h3>
              <p className="text-xs text-slate-400">
                Support Manual Review Transition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Reason for Escalation <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">
                {reason.length}/500 chars (min 10)
              </span>
            </div>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={10}
              maxLength={500}
              required
              placeholder="Provide reason for escalating this ticket to human tier..."
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-orange-600 hover:bg-orange-500 transition shadow-lg shadow-orange-600/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Escalating..." : "Confirm Escalation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
