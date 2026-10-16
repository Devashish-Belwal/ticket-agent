"use client";
import React, { useState } from "react";
import { Sparkles, Key, Mail, Lock, Shield, User, ArrowRight } from "lucide-react";
import { api, type User as UserType } from "@/lib/api";

const PRESET_ACCOUNTS = [
  {
    role: "CUSTOMER",
    title: "Customer 1 (Aarav)",
    email: "customer1@s30.test",
    password: "password123",
    desc: "Owns ORD-1001 (Keyboard ₹1,500), ORD-1002 (Headphones ₹4,999), ORD-OLD-1",
    badge: "Customer Account",
    color: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60",
  },
  {
    role: "CUSTOMER",
    title: "Customer 2 (Mira)",
    email: "customer2@s30.test",
    password: "password123",
    desc: "Owns ORD-1003 (Mouse ₹999 - Out of Stock in inventory)",
    badge: "Customer Account",
    color: "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60",
  },
  {
    role: "SUPPORT",
    title: "S30 Support Agent",
    email: "support@s30.test",
    password: "password123",
    desc: "Approves high-value refunds (>₹2,000), manual escalation, sees all tickets",
    badge: "Support Account",
    color: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60",
  },
];

export const LoginModal = ({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: UserType) => void;
}) => {
  const [email, setEmail] = useState("customer1@s30.test");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(presetEmail, presetPass);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 mb-3 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Sign in to S30 Support Agent
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select a seeded profile or log in with credentials
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* Preset 1-click accounts */}
          <div className="space-y-2 mb-6">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
              ⚡ Quick Select Seed Account
            </div>
            {PRESET_ACCOUNTS.map((preset) => (
              <button
                key={preset.email}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin(preset.email, preset.password)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${preset.color}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800/80 text-white mt-0.5">
                    {preset.role === "SUPPORT" ? (
                      <Shield className="w-4 h-4 text-amber-400" />
                    ) : (
                      <User className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition">
                        {preset.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {preset.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      {preset.email}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {preset.desc}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition" />
              </button>
            ))}
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-semibold">
                Or custom credentials
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
