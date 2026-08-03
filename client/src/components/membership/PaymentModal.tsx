"use client";

import { useState, FormEvent } from "react";
import {
  IconCreditCard,
  IconCheck,
  IconLock,
  IconX,
  IconSparkles,
  IconShieldCheck,
  IconBrandPaypal,
  IconBrandApple,
  IconQrcode
} from "@tabler/icons-react";
import { playSound, triggerHaptic } from "@/lib/audioEffects";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: string;
  billingCycle: string;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  planName,
  price,
  billingCycle,
  onSuccess
}: PaymentModalProps) {
  const [method, setMethod] = useState<"card" | "upi" | "paypal" | "apple">("card");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form states
  const [cardNumber, setCardNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  if (!isOpen) return null;

  const handlePay = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setCompleted(true);
      playSound("win");
      triggerHaptic("gameover");

      setTimeout(() => {
        onSuccess();
        setCompleted(false);
        onClose();
      }, 2000);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
      <div className="card w-full max-w-md bg-[#121620] border border-[#1f293d] shadow-2xl rounded-2xl overflow-hidden p-6 relative animate__animated animate__zoomIn">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-xs btn-circle btn-ghost text-slate-400 hover:text-white"
        >
          <IconX size={16} />
        </button>

        {completed ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center animate-bounce">
              <IconCheck size={36} />
            </div>
            <h3 className="text-2xl font-black text-white">Payment Successful!</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Welcome to <span className="text-emerald-400 font-bold">{planName} Membership</span>. All features, AI coach analysis, and GM database tools are now active on your profile!
            </p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                <IconSparkles size={14} /> Instant Membership Checkout
              </div>
              <h2 className="text-xl font-black text-white">Upgrade to {planName}</h2>
              <p className="text-xs text-slate-400">
                Total Amount: <span className="text-emerald-400 font-bold">{price}</span> / {billingCycle}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "card", label: "Card", icon: IconCreditCard },
                { id: "upi", label: "UPI", icon: IconQrcode },
                { id: "paypal", label: "PayPal", icon: IconBrandPaypal },
                { id: "apple", label: "Apple Pay", icon: IconBrandApple }
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = method === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-base-200 border-base-300 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <IconComp size={20} className="mb-1" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Payment Fields */}
            {method === "card" && (
              <div className="space-y-3 bg-base-200/60 p-4 rounded-xl border border-base-300">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="4532 •••• •••• 8912"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="input input-bordered input-sm w-full font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM / YY"
                      className="input input-bordered input-sm w-full font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="•••"
                      className="input input-bordered input-sm w-full font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === "upi" && (
              <div className="space-y-3 bg-base-200/60 p-4 rounded-xl border border-base-300">
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                  Virtual Payment Address (UPI ID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="username@gpay / username@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="input input-bordered input-sm w-full font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500">
                  Accepts Google Pay, PhonePe, Paytm, and all major Indian UPI bank handles.
                </p>
              </div>
            )}

            {(method === "paypal" || method === "apple") && (
              <div className="p-4 bg-base-200/60 rounded-xl border border-base-300 text-center space-y-2">
                <p className="text-xs text-slate-300 font-semibold">
                  Click below to authorize your {method === "paypal" ? "PayPal Account" : "Apple Pay Wallet"}.
                </p>
              </div>
            )}

            {/* Guarantee & Pay Button */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <IconLock size={12} className="text-emerald-400" /> 256-Bit SSL Encrypted
                </span>
                <span className="flex items-center gap-1">
                  <IconShieldCheck size={12} className="text-emerald-400" /> Cancel Anytime
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-emerald w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-0 shadow-lg ${
                  loading ? "loading" : ""
                }`}
              >
                {loading ? "Processing Secure Checkout..." : `Pay ${price} & Activate ${planName}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
