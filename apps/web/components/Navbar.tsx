"use client";
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  User,
  Shield,
  LogOut,
  Layers,
  Activity,
  ChevronDown,
} from "lucide-react";
import { type User as UserType, clearStoredAuth, api } from "@/lib/api";

const PRESET_USERS = [
  {
    label: "Aarav (Customer 1)",
    email: "customer1@s30.test",
    password: "password123",
    role: "CUSTOMER",
    color: "from-blue-500 to-cyan-500",
  },
  {
    label: "Mira (Customer 2)",
    email: "customer2@s30.test",
    password: "password123",
    role: "CUSTOMER",
    color: "from-indigo-500 to-purple-500",
  },
  {
    label: "S30 Support (Agent)",
    email: "support@s30.test",
    password: "password123",
    role: "SUPPORT",
    color: "from-amber-500 to-orange-500",
  },
];

export const Navbar = ({
  currentUser,
  onUserChange,
  onOpenSystemDrawer,
  onOpenNewTicket,
}: {
  currentUser: UserType | null;
  onUserChange: (user: UserType | null) => void;
  onOpenSystemDrawer: () => void;
  onOpenNewTicket?: () => void;
}) => {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.health();
        setBackendHealthy(res.status === "ok");
      } catch {
        setBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickSwitch = async (email: string, pass: string) => {
    setIsSwitching(true);
    try {
      const res = await api.login(email, pass);
      onUserChange(res.user);
    } catch (err: any) {
      alert("Failed to switch user: " + err.message);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    onUserChange(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="h-full w-full bg-slate-950 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                S30 Ticket Agent
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Support & Resolution Backend
            </p>
          </div>
        </div>

        {/* Center: Quick Persona Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 px-2 font-medium">Switch Role:</span>
          {PRESET_USERS.map((preset) => {
            const isActive = currentUser?.email === preset.email;
            return (
              <button
                key={preset.email}
                disabled={isSwitching}
                onClick={() => handleQuickSwitch(preset.email, preset.password)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-gradient-to-r text-white shadow-sm font-semibold " + preset.color
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {preset.role === "SUPPORT" ? (
                  <Shield className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend Status indicator */}
          <div
            title={backendHealthy ? "Backend connected" : "Backend unreachable"}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                backendHealthy === true
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : backendHealthy === false
                  ? "bg-rose-500"
                  : "bg-amber-400"
              }`}
            />
            <span>{backendHealthy ? "API 200 OK" : "API OFFLINE"}</span>
          </div>

          {/* System Drawer button */}
          <button
            onClick={onOpenSystemDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Policies & Stock</span>
          </button>

          {/* Current User & Logout */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-white">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                  <span
                    className={`font-semibold ${
                      currentUser.role === "SUPPORT"
                        ? "text-amber-400"
                        : "text-blue-400"
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
