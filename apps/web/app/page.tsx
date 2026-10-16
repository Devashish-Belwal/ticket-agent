"use client";
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Repeat,
  DollarSign,
  HelpCircle,
  Plus,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LoginModal } from "@/components/LoginModal";
import { TicketList } from "@/components/TicketList";
import { TicketDetail } from "@/components/TicketDetail";
import { NewTicketModal } from "@/components/NewTicketModal";
import { SystemStateDrawer } from "@/components/SystemStateDrawer";
import { Spotlight } from "@/components/ui/spotlight";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import {
  api,
  getStoredUser,
  getStoredToken,
  type User as UserType,
  type Ticket,
} from "@/lib/api";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState("ALL");
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isSystemDrawerOpen, setIsSystemDrawerOpen] = useState(false);

  // Auto-init user from storage or auto-login customer1
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();

      if (storedUser && storedToken) {
        setCurrentUser(storedUser);
      } else {
        // Auto-login default Customer 1 for immediate live experience
        try {
          const res = await api.login("customer1@s30.test", "password123");
          setCurrentUser(res.user);
        } catch {
          // If auto login fails, open login modal
          setIsLoginOpen(true);
        }
      }
      setIsAuthLoaded(true);
    };

    initAuth();
  }, []);

  const fetchTickets = async () => {
    if (!currentUser) return;
    setLoadingTickets(true);
    try {
      const res = await api.getTickets(currentFilter);
      setTickets(res.tickets);
      if (res.tickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(res.tickets[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    } else {
      setTickets([]);
      setSelectedTicketId(null);
    }
  }, [currentUser, currentFilter]);

  const handleUserChange = (user: UserType | null) => {
    setCurrentUser(user);
    setSelectedTicketId(null);
    if (!user) {
      setIsLoginOpen(true);
    }
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    fetchTickets();
    setSelectedTicketId(newTicket.id);
  };

  const featureCards = [
    {
      title: "Damaged Item Replacement",
      description:
        "Agent verifies delivered within 7 days, checks inventory stock, and decrements stock by 1 atomically.",
      badge: "Auto-Resolution",
      icon: <Repeat className="w-5 h-5" />,
      actionText: "Try ORD-1001 scenario",
      onClick: () => setIsNewTicketOpen(true),
    },
    {
      title: "High-Value Refund Review",
      description:
        "Refunds above ₹2,000 create a pending action and place the ticket in Awaiting Approval for human support.",
      badge: "Support Approval Tier",
      icon: <DollarSign className="w-5 h-5" />,
      actionText: "Try ORD-1002 scenario",
      onClick: () => setIsNewTicketOpen(true),
    },
    {
      title: "Needs Information Flow",
      description:
        "When key order details are missing, the agent asks clarifying questions, moving ticket to Needs Information.",
      badge: "Interactive Inquiry",
      icon: <HelpCircle className="w-5 h-5" />,
      actionText: "Try missing-order scenario",
      onClick: () => setIsNewTicketOpen(true),
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Aceternity Spotlight Background effect */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="cyan" />
      <BackgroundBeams className="z-0" />

      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onOpenSystemDrawer={() => setIsSystemDrawerOpen(true)}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {currentUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[750px]">
            {/* Left Column: Ticket List */}
            <div className="lg:col-span-5 xl:col-span-4 h-[750px]">
              <TicketList
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={(id) => setSelectedTicketId(id)}
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
                currentFilter={currentFilter}
                onFilterChange={(f) => setCurrentFilter(f)}
                isSupport={currentUser.role === "SUPPORT"}
                loading={loadingTickets}
              />
            </div>

            {/* Right Column: Ticket Detail */}
            <div className="lg:col-span-7 xl:col-span-8 h-[750px]">
              {selectedTicketId ? (
                <TicketDetail
                  ticketId={selectedTicketId}
                  currentUser={currentUser}
                  onTicketUpdated={fetchTickets}
                />
              ) : (
                <div className="h-full flex flex-col justify-center items-center p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-2xl">
                  <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 animate-bounce">
                    <Bot className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Select a Support Ticket
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mb-6">
                    Choose a ticket from the left panel to inspect customer messages,
                    run the multi-step AI agent, and view live server tool traces.
                  </p>
                  {currentUser.role === "CUSTOMER" && (
                    <button
                      onClick={() => setIsNewTicketOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Your First Ticket</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Logged out landing screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="inline-flex p-3 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-400 mb-6 shadow-xl shadow-blue-500/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl">
              Autonomous AI Customer Support Agent
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl">
              Express + TypeScript runtime executing multi-step server-side tool calling,
              policy investigations, inventory deductions, and human-in-the-loop approvals.
            </p>
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/30"
              >
                Sign In to Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* Bottom Feature Cards */}
        <div className="mt-8 pt-8 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supported Autonomous Support Workflows</span>
          </div>
          <HoverEffect items={featureCards} />
        </div>
      </main>

      {/* Global Modals & Drawers */}
      {isLoginOpen && (
        <LoginModal
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginOpen(false);
          }}
        />
      )}

      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onCreated={handleTicketCreated}
      />

      <SystemStateDrawer
        isOpen={isSystemDrawerOpen}
        onClose={() => setIsSystemDrawerOpen(false)}
      />
    </div>
  );
}
