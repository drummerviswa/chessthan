"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/config";

function ResetPasswordPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<"error" | "success">("error");

    async function handleResetSubmit(e: FormEvent) {
        e.preventDefault();
        setMessage(null);

        if (!token) {
            setMessageType("error");
            setMessage("Invalid or missing reset token.");
            return;
        }

        if (password !== confirmPassword) {
            setMessageType("error");
            setMessage("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/v1/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                setMessageType("success");
                setMessage("Password updated successfully! Redirecting you to home...");
                setTimeout(() => {
                    router.push("/");
                }, 3000);
            } else {
                setMessageType("error");
                setMessage(data.message || "Failed to reset password.");
            }
        } catch (e) {
            console.error(e);
            setMessageType("error");
            setMessage("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center w-full min-h-[60vh] p-4">
            <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-300">
                <div className="card-body p-6">
                    <h2 className="card-title text-xl font-bold mb-2">🔒 Set New Password</h2>
                    <p className="text-xs text-base-content/60 mb-4">
                        Please enter your new password below.
                    </p>

                    <form onSubmit={handleResetSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label py-1" htmlFor="newPassword">
                                <span className="label-text text-xs">New Password</span>
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input input-bordered input-sm w-full"
                                minLength={3}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label py-1" htmlFor="confirmPassword">
                                <span className="label-text text-xs">Confirm Password</span>
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input input-bordered input-sm w-full"
                                minLength={3}
                                required
                            />
                        </div>

                        {message && (
                            <div className={`text-xs font-semibold ${messageType === "success" ? "text-success" : "text-error"}`}>
                                {message}
                            </div>
                        )}

                        <div className="card-actions justify-end mt-4">
                            <button
                                type="submit"
                                className={`btn btn-sm btn-primary w-full ${loading ? "loading" : ""}`}
                                disabled={loading || !token}
                            >
                                Reset Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh] w-full">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        }>
            <ResetPasswordPageContent />
        </Suspense>
    );
}
