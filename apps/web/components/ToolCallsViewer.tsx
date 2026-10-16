"use client";
import React, { useState } from "react";
import {
  Terminal,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Box,
  Repeat,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import type { ToolCall } from "@/lib/api";

const getToolIcon = (name: string) => {
  switch (name) {
    case "getOrder":
    case "getCustomerOrders":
      return <Database className="w-3.5 h-3.5 text-blue-400" />;
    case "searchPolicies":
      return <Search className="w-3.5 h-3.5 text-purple-400" />;
    case "checkInventory":
      return <Box className="w-3.5 h-3.5 text-cyan-400" />;
    case "createReplacement":
      return <Repeat className="w-3.5 h-3.5 text-emerald-400" />;
    case "createRefundRequest":
      return <DollarSign className="w-3.5 h-3.5 text-amber-400" />;
    case "escalateToHuman":
      return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
    default:
      return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
  }
};

export const ToolCallsViewer = ({ toolCalls }: { toolCalls: ToolCall[] }) => {
  const [expandedCalls, setExpandedCalls] = useState<Record<string, boolean>>({});

  if (!toolCalls || toolCalls.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl bg-slate-950/50 border border-slate-800/80">
        <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
        <p className="text-xs text-slate-500">
          No tool execution calls recorded yet.
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          When the agent runs, every server-side function execution will trace here.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedCalls((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">
            Agent Tool Call Trace
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-cyan-400 font-mono">
            {toolCalls.length} / 6 max steps
          </span>
        </div>
        <button
          onClick={() => {
            const allExpanded = Object.keys(expandedCalls).length === toolCalls.length;
            if (allExpanded) {
              setExpandedCalls({});
            } else {
              const full: Record<string, boolean> = {};
              toolCalls.forEach((tc) => (full[tc.id] = true));
              setExpandedCalls(full);
            }
          }}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono"
        >
          Toggle All
        </button>
      </div>

      <div className="space-y-2">
        {toolCalls.map((call) => {
          const isExpanded = !!expandedCalls[call.id];
          const isSuccess = call.status === "SUCCEEDED";

          return (
            <div
              key={call.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isSuccess
                  ? "bg-slate-950/80 border-slate-800/90 hover:border-slate-700"
                  : "bg-rose-950/10 border-rose-900/40 hover:border-rose-800/60"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(call.id)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-[11px] text-slate-400 font-bold shrink-0">
                    #{call.sequence}
                  </div>
                  <div className="p-1 rounded-md bg-slate-900/80 shrink-0">
                    {getToolIcon(call.toolName)}
                  </div>
                  <div className="font-mono text-xs font-semibold text-white truncate">
                    {call.toolName}()
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSuccess
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {call.status}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-900/90 space-y-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Arguments
                    </div>
                    <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-300 overflow-x-auto text-[11px] border border-slate-800/80">
                      {JSON.stringify(call.arguments, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                      {isSuccess ? "Result" : "Error"}
                    </div>
                    <pre
                      className={`p-2.5 rounded-xl overflow-x-auto text-[11px] border ${
                        isSuccess
                          ? "bg-slate-900 text-emerald-300 border-slate-800/80"
                          : "bg-rose-950/40 text-rose-300 border-rose-900/40"
                      }`}
                    >
                      {JSON.stringify(isSuccess ? call.result : call.error, null, 2)}
                    </pre>
                  </div>

                  <div className="text-[10px] text-slate-600 flex justify-between pt-1">
                    <span>ID: {call.id}</span>
                    <span>{new Date(call.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
