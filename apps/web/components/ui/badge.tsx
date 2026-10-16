import React from "react";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/api";

const statusConfig: Record<
  TicketStatus,
  { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  OPEN: {
    label: "Open",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  PROCESSING: {
    label: "Processing",
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/40",
    dot: "bg-purple-400",
    pulse: true,
  },
  NEEDS_INFORMATION: {
    label: "Needs Information",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    pulse: true,
  },
  AWAITING_APPROVAL: {
    label: "Awaiting Approval",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/40",
    dot: "bg-rose-400",
    pulse: true,
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  ESCALATED: {
    label: "Escalated",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-400",
  },
};

export const StatusBadge = ({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) => {
  const conf = statusConfig[status] || {
    label: status,
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        conf.bg,
        conf.text,
        conf.border,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {conf.pulse && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              conf.dot
            )}
          />
        )}
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", conf.dot)}
        />
      </span>
      {conf.label}
    </span>
  );
};
