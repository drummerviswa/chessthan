"use client";

import { useState, useContext } from "react";
import { useSession } from "next-auth/react";
import { SessionContext } from "@/context/session";
import { API_URL } from "@/config";

// Dynamic script loader for Razorpay Checkout
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function UpgradeModal() {
    const { data: authSession, update: updateSession } = useSession();
    const sessionContext = useContext(SessionContext);
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");

    const handleUpgrade = async () => {
        setLoading(true);
        setStatus("idle");
        
        try {
            // 1. Load Razorpay JS SDK
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
            }

            // 2. Call backend to create subscription ID
            const res = await fetch(`${API_URL}/v1/billing/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to initialize checkout. Please log in first.");
            }

            const checkoutData = await res.json();
            const { subscriptionId, key, mock } = checkoutData;

            // 3. Handle mock billing bypass for development
            if (mock) {
                console.log("Mock Billing Enabled. Simulating payment success...");
                
                // Confirm with mock payment validation
                const verifyRes = await fetch(`${API_URL}/v1/billing/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        razorpay_payment_id: "pay_mock_12345",
                        razorpay_subscription_id: subscriptionId,
                        razorpay_signature: "mock_signature"
                    }),
                    credentials: "include"
                });

                if (verifyRes.ok) {
                    setStatus("success");
                    setStatusMsg("Successfully upgraded to PRO! Welcome to Chessthan Premium.");
                    
                    // Update session contexts
                    await updateSession({ subscriptionStatus: "active" });
                    if (sessionContext?.user) {
                        sessionContext.setUser({
                            ...sessionContext.user,
                            subscriptionStatus: "active"
                        });
                    }
                } else {
                    throw new Error("Mock signature verification failed.");
                }
                setLoading(false);
                return;
            }

            // 4. Configure real Razorpay Checkout modal
            const options = {
                key,
                subscription_id: subscriptionId,
                name: "Chessthan Pro",
                description: "Monthly Premium Chess SaaS Plan",
                image: "/gaming.png",
                handler: async function (response: any) {
                    setLoading(true);
                    try {
                        const verifyRes = await fetch(`${API_URL}/v1/billing/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature
                            }),
                            credentials: "include"
                        });

                        if (verifyRes.ok) {
                            setStatus("success");
                            setStatusMsg("Successfully upgraded to PRO! Welcome to Chessthan Premium.");
                            
                            // Update session token details
                            await updateSession({ subscriptionStatus: "active" });
                            if (sessionContext?.user) {
                                sessionContext.setUser({
                                    ...sessionContext.user,
                                    subscriptionStatus: "active"
                                });
                            }
                        } else {
                            throw new Error("Payment signature verification failed.");
                        }
                    } catch (err: any) {
                        setStatus("error");
                        setStatusMsg(err.message || "Failed to verify transaction.");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: authSession?.user?.name || "",
                    email: authSession?.user?.email || ""
                },
                theme: {
                    color: "#0070f3"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            console.error("Razorpay Checkout Error:", err);
            setStatus("error");
            setStatusMsg(err.message || "Failed to complete checkout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <input type="checkbox" id="upgrade-modal" className="modal-toggle" />
            <label htmlFor="upgrade-modal" className="modal cursor-pointer">
                <label className="modal-box flex max-w-sm flex-col gap-4 relative">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        ⭐ Upgrade to Premium Pro
                    </h3>
                    <p className="text-xs text-base-content/60">
                        Get the ultimate chess mastery experience.
                    </p>

                    <div className="space-y-3 bg-base-200 p-4 rounded-lg border border-base-300">
                        <div className="flex justify-between text-sm font-semibold border-b border-base-300 pb-2 mb-2">
                            <span>Plan Features</span>
                            <span className="text-primary">₹299/mo</span>
                        </div>
                        <ul className="text-xs space-y-1 list-disc list-inside text-base-content/85">
                            <li>Unlimited Gemini AI move tutor logs</li>
                            <li>Play vs custom Bot GM personalities</li>
                            <li>Unlisted matches & spectating chat</li>
                            <li>Unlimited tactical puzzles & rush mode</li>
                            <li>Permanent ad-free dashboard</li>
                        </ul>
                    </div>

                    {status === "success" && (
                        <div className="alert alert-success text-xs py-2 px-3 rounded text-success-content">
                            <span>{statusMsg}</span>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="alert alert-error text-xs py-2 px-3 rounded text-error-content">
                            <span>{statusMsg}</span>
                        </div>
                    )}

                    <div className="modal-action flex justify-end gap-2 mt-4">
                        <label htmlFor="upgrade-modal" className="btn btn-sm btn-ghost">
                            Close
                        </label>
                        {status !== "success" && (
                            <button
                                onClick={handleUpgrade}
                                className={`btn btn-sm btn-primary ${loading ? "loading" : ""}`}
                                disabled={loading}
                            >
                                Pay & Upgrade
                            </button>
                        )}
                    </div>
                </label>
            </label>
        </>
    );
}
