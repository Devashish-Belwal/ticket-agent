"use client";
import React, { useState } from "react";
import { X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { api, type PendingAction } from "@/lib/api";

export const ApprovalModal = ({
  isOpen,
  ticketId,
  pendingAction,
  onClose,
  onResolved,
}: {
  isOpen: boolean;
  ticketId: string;
  pendingAction: PendingAction | null;
  onClose: () => void;
  onResolved: () => void;
}) => {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.approve(ticketId, decision, note.trim() || undefined);
      onResolved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit approval decision");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Support Review & Approval
              </h3>
              <p className="text-xs text-slate-400">
                Action requires human support verification
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

        {pendingAction && (
          <div className="mb-5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <div className="text-slate-400 font-medium">Pending Action Details:</div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Type:</span>
              <span className="font-mono font-bold text-white">{pendingAction.type}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Amount:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                ₹{pendingAction.amount?.toLocaleString() ?? "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold text-[10px]">
                {pendingAction.status}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("APPROVED")}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition ${
                  decision === "APPROVED"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Approve Refund</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("REJECTED")}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition ${
                  decision === "REJECTED"
                    ? "bg-rose-500/10 border-rose-500 text-rose-300 shadow-sm shadow-rose-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject & Escalate</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Internal Note <span className="text-slate-500">(Optional, max 500 chars)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="e.g. Checked invoice and approved, or details insufficient..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
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
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition disabled:opacity-50 ${
                decision === "APPROVED"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20"
              }`}
            >
              {loading ? "Submitting..." : `Confirm ${decision}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
