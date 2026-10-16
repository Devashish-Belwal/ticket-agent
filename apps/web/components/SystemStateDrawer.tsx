"use client";
import React from "react";
import { X, Layers, Box, FileText, ShoppingBag, ShieldCheck } from "lucide-react";

export const SystemStateDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Reference</h3>
              <p className="text-xs text-slate-400">Inventory, Policies & Seed Data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs flex-1">
          {/* Inventory */}
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span>Products & Live Inventory</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">Mechanical Keyboard</div>
                  <div className="text-[11px] text-slate-500 font-mono">PROD-KEYBOARD</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400 font-bold">10 in stock</div>
                  <div className="text-[11px] text-slate-400">₹1,500</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">Wireless Headphones</div>
                  <div className="text-[11px] text-slate-500 font-mono">PROD-HEADPHONES</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400 font-bold">5 in stock</div>
                  <div className="text-[11px] text-slate-400">₹4,999</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">Wireless Mouse</div>
                  <div className="text-[11px] text-slate-500 font-mono">PROD-MOUSE</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-rose-400 font-bold">0 in stock</div>
                  <div className="text-[11px] text-slate-400">₹999</div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Policies */}
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Company Support Policies</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-purple-300">Replacement Policy</div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  Damaged delivered items can be replaced within <strong>7 days</strong> when inventory stock exists. Decrements stock by 1 atomically.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-amber-300">Refund Policy</div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  Delivered orders can be refunded within <strong>30 days</strong>. Refunds up to ₹2,000 complete automatically; refunds above ₹2,000 create a pending approval for support.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-rose-300">Duplicate Action Rule</div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  An order may receive only <strong>one refund or replacement</strong> total. Re-running the identical action returns the existing action idempotently.
                </p>
              </div>
            </div>
          </div>

          {/* Seeded Orders */}
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <span>Seeded Orders Reference</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                <div>
                  <span className="font-mono font-bold text-blue-400">ORD-1001</span>
                  <span className="text-slate-400 ml-1.5">(Customer 1)</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Keyboard • 3d ago</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                <div>
                  <span className="font-mono font-bold text-blue-400">ORD-1002</span>
                  <span className="text-slate-400 ml-1.5">(Customer 1)</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Headphones • 5d ago</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                <div>
                  <span className="font-mono font-bold text-indigo-400">ORD-1003</span>
                  <span className="text-slate-400 ml-1.5">(Customer 2)</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Mouse • 2d ago</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                <div>
                  <span className="font-mono font-bold text-slate-400">ORD-OLD-1</span>
                  <span className="text-slate-500 ml-1.5">(Customer 1)</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">Delivered 45d ago</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-400">ORD-SHIPPED-1</span>
                  <span className="text-slate-500 ml-1.5">(Customer 1)</span>
                </div>
                <span className="text-amber-400 font-mono text-[11px]">SHIPPED (Not Deliv.)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
