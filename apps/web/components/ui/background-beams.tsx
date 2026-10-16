"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] pointer-events-none opacity-40",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10" />
      <svg
        className="absolute top-0 left-0 w-full h-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
      {/* Dynamic light beams */}
      <motion.div
        animate={{
          x: ["-20%", "20%", "-20%"],
          y: ["-10%", "10%", "-10%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[300px] left-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[140px]"
      />
      <motion.div
        animate={{
          x: ["20%", "-20%", "20%"],
          y: ["10%", "-10%", "10%"],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[200px] right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[140px]"
      />
    </div>
  );
};
