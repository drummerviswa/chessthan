"use client";

import { useState, useContext } from "react";
import { SessionContext } from "@/context/session";
import PaymentModal from "@/components/membership/PaymentModal";
import {
  IconCrown,
  IconCheck,
  IconBrain,
  IconBook,
  IconShieldCheck
} from "@tabler/icons-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  popular?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Arena",
    price: "$0",
    period: "Forever",
    features: [
      "Unlimited Online Matches",
      "5 AI Bot Practice Games / Day",
      "Standard Chessboard Themes",
      "Basic Stockfish 16 Engine"
    ]
  },
  {
    id: "gold",
    name: "Gold Member",
    price: "$4.99",
    period: "per month",
    badge: "GOLD",
    features: [
      "Everything in Free",
      "25 Daily AI Coach Reviews",
      "Full Openings Explorer",
      "Ad-Free Platform Experience",
      "Custom Board & Piece Styles"
    ]
  },
  {
    id: "diamond",
    name: "Diamond Master",
    price: "$12.99",
    period: "per month",
    badge: "DIAMOND PRO",
    popular: true,
    features: [
      "Unlimited Gemini AI Coach Analysis",
      "Full PGN Mentor Opening Explorer",
      "Grandmaster Classics Database",
      "Verified Diamond Profile Crown Badge",
      "Priority Bot & Arena Matchmaking",
      "Custom Board Audio & Haptic Themes"
    ]
  }
];

export default function MembershipPage() {
  const session = useContext(SessionContext);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<string | null>(
    session?.user?.subscriptionStatus === "active" ? "diamond" : null
  );

  const handleOpenCheckout = (plan: Plan) => {
    if (plan.id === "free") return;
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setActiveSubscription(selectedPlan?.id || "diamond");
    if (session?.user && session.setUser) {
      session.setUser({
        ...session.user,
        subscriptionStatus: "active"
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-8 animate__animated animate__fadeIn">
      {/* Header Banner */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
          <IconCrown size={16} /> Premium Platform Membership
        </div>
        <h1 className="text-4xl font-black text-slate-100 tracking-tight">
          Elevate Your Chess Master Journey
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Unlock unlimited Gemini AI match analysis, master openings, custom themes, and verified profile status.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => {
          const isCurrent = activeSubscription === plan.id;
          return (
            <div
              key={plan.id}
              className={`card bg-base-200 border transition-all duration-200 p-6 flex flex-col justify-between relative rounded-2xl ${
                plan.popular
                  ? "border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500"
                  : "border-base-300 hover:border-slate-600"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold uppercase font-mono tracking-widest shadow">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-100">{plan.name}</h3>
                  {plan.badge && (
                    <span className="badge badge-warning badge-xs font-black px-2 py-0.5">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-100">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-mono">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-base-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <IconCheck size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-4 border-t border-base-300">
                {isCurrent ? (
                  <button className="btn btn-sm btn-success w-full font-bold normal-case gap-1" disabled>
                    <IconCheck size={16} /> Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(plan)}
                    className={`btn btn-sm w-full font-bold normal-case ${
                      plan.popular
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg"
                        : "btn-outline border-base-300 text-slate-200"
                    }`}
                  >
                    {plan.id === "free" ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Guarantee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 bg-base-200 border border-base-300 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <IconBrain size={16} /> Gemini AI Game Coach
          </div>
          <p className="text-[11px] text-slate-400">
            Get move-by-move explanations, tactical blunders identified, and custom training recommendations.
          </p>
        </div>
        <div className="p-4 bg-base-200 border border-base-300 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
            <IconBook size={16} /> Grandmaster ECO Library
          </div>
          <p className="text-[11px] text-slate-400">
            Explore 10,000+ grandmaster games with move notations and win rate probabilities.
          </p>
        </div>
        <div className="p-4 bg-base-200 border border-base-300 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <IconShieldCheck size={16} /> Instant Activation
          </div>
          <p className="text-[11px] text-slate-400">
            Cancel or downgrade anytime. Payment processing is 256-bit encrypted with instant activation.
          </p>
        </div>
      </div>

      {selectedPlan && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          planName={selectedPlan.name}
          price={selectedPlan.price}
          billingCycle={selectedPlan.period}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
