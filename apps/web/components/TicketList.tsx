"use client";
import React, { useState } from "react";
import {
  Search,
  Plus,
  Inbox,
  Filter,
  Package,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type { Ticket, TicketStatus } from "@/lib/api";
import { StatusBadge } from "./ui/badge";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Needs Info", value: "NEEDS_INFORMATION" },
  { label: "Approval", value: "AWAITING_APPROVAL" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Escalated", value: "ESCALATED" },
];

export const TicketList = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onOpenNewTicket,
  currentFilter,
  onFilterChange,
  isSupport,
  loading,
}: {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  onOpenNewTicket: () => void;
  currentFilter: string;
  onFilterChange: (status: string) => void;
  isSupport: boolean;
  loading: boolean;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      (t.orderId && t.orderId.toLowerCase().includes(q)) ||
      t.customerId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-400" />
              <span>{isSupport ? "All Customer Tickets" : "My Support Tickets"}</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {isSupport
                ? "Full support queue visibility across all accounts"
                : "Manage and run agent on your support requests"}
            </p>
          </div>

          {!isSupport && (
            <button
              onClick={onOpenNewTicket}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets, subject, order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                currentFilter === f.value
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 my-4">
            <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-400 font-medium">No tickets found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {!isSupport
                ? "Click 'New Ticket' to create your first order issue."
                : "No customer tickets match the selected filter."}
            </p>
            {!isSupport && (
              <button
                onClick={onOpenNewTicket}
                className="mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Ticket</span>
              </button>
            )}
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isSelected = ticket.id === selectedTicketId;
            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-slate-950 border-blue-500/60 shadow-md shadow-blue-500/10"
                    : "bg-slate-950/50 border-slate-850 hover:bg-slate-950 hover:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {ticket.id}
                    </span>
                    {ticket.orderId && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-blue-400">
                        <Package className="w-2.5 h-2.5" />
                        {ticket.orderId}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>

                <h4 className="text-xs font-semibold text-white line-clamp-1 mb-1">
                  {ticket.subject}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  {isSupport ? (
                    <span className="font-mono text-slate-400 truncate max-w-[120px]">
                      {ticket.customerId}
                    </span>
                  ) : (
                    <span>Ticket Owner</span>
                  )}
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
