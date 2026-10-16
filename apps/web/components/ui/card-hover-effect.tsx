"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";

export const HoverEffect = ({
  items,
  className,
  onSelect,
}: {
  items: {
    title: string;
    description: string;
    badge?: string;
    icon?: React.ReactNode;
    actionText?: string;
    onClick?: () => void;
  }[];
  className?: string;
  onSelect?: (index: number) => void;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-4 gap-4",
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={item.title}
          className="relative group block p-2 h-full w-full cursor-pointer"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => {
            item.onClick?.();
            onSelect?.(idx);
          }}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-slate-800/[0.8] block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <div className="rounded-2xl h-full w-full p-4 overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-slate-700 relative z-20 transition-all duration-200">
            <div className="relative z-50">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  {item.icon}
                </div>
                {item.badge && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {item.badge}
                  </span>
                )}
              </div>
              <h4 className="text-slate-100 font-bold tracking-wide mt-2">
                {item.title}
              </h4>
              <p className="mt-2 text-slate-400 tracking-wide leading-relaxed text-sm">
                {item.description}
              </p>
              {item.actionText && (
                <div className="mt-4 text-xs font-medium text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                  {item.actionText} →
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
