"use client";

import { SessionContext } from "@/context/session";
import { logout, setGuestSession } from "@/lib/auth";
import Link from "next/link";
import type { FormEvent } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { API_URL } from "@/config";

import { IconSettings2, IconUserCircle, IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react";
import Guest from "./Guest";
import Login from "./Login";
import Register from "./Register";

export default function AuthModal() {
  const session = useContext(SessionContext);
  const [activeTab, setActiveTab] = useState<"guest" | "login" | "register" | "forgot">("guest");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverMessageType, setServerMessageType] = useState<"error" | "success">("error");
  const [buttonLoading, setButtonLoading] = useState(false);
  const modalToggleRef = useRef<HTMLInputElement>(null);

  async function clickLogout() {
    setServerMessage(null);
    setActiveTab("login");
    // Sign out of NextAuth
    await signOut({ redirect: false });
    // Sign out of legacy guest session
    await logout();
    session?.setUser(null);
  }

  async function submitAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerMessage(null);
    setButtonLoading(true);

    const target = e.target as HTMLFormElement;

    try {
      if (activeTab === "guest") {
        const guestName = target.elements.namedItem("guestName") as HTMLInputElement;
        if (!guestName || !guestName.value) {
          setButtonLoading(false);
          return;
        }

        const user = await setGuestSession(guestName.value);
        if (user) {
          session?.setUser(user);
          if (modalToggleRef.current) {
            modalToggleRef.current.checked = false;
          }
        } else {
          setServerMessageType("error");
          setServerMessage("Failed to create guest session.");
        }
        guestName.value = "";
      } else if (activeTab === "login") {
        const nameEl = target.elements.namedItem("loginName") as HTMLInputElement;
        const passwordEl = target.elements.namedItem("loginPassword") as HTMLInputElement;

        if (!nameEl?.value || !passwordEl?.value) {
          setButtonLoading(false);
          return;
        }

        const result = await signIn("credentials", {
          username: nameEl.value,
          password: passwordEl.value,
          redirect: false
        });

        if (result?.error) {
          setServerMessageType("error");
          setServerMessage("Invalid username/email or password.");
        } else {
          if (modalToggleRef.current) {
            modalToggleRef.current.checked = false;
          }
          nameEl.value = "";
          passwordEl.value = "";
        }
      } else if (activeTab === "register") {
        const nameEl = target.elements.namedItem("registerName") as HTMLInputElement;
        const emailEl = target.elements.namedItem("registerEmail") as HTMLInputElement;
        const passwordEl = target.elements.namedItem("registerPassword") as HTMLInputElement;

        if (!nameEl?.value || !passwordEl?.value) {
          setButtonLoading(false);
          return;
        }

        // Register user via backend Express API
        const registerRes = await fetch(`${API_URL}/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameEl.value,
            email: emailEl.value || undefined,
            password: passwordEl.value
          })
        });

        const data = await registerRes.json().catch(() => ({}));

        if (!registerRes.ok) {
          setServerMessageType("error");
          setServerMessage(data.message || "Registration failed.");
        } else {
          // Log in automatically after registration
          const loginResult = await signIn("credentials", {
            username: nameEl.value,
            password: passwordEl.value,
            redirect: false
          });

          if (!loginResult?.error) {
            if (modalToggleRef.current) {
              modalToggleRef.current.checked = false;
            }
          }
          nameEl.value = "";
          emailEl.value = "";
          passwordEl.value = "";
        }
      } else if (activeTab === "forgot") {
        const emailEl = target.elements.namedItem("forgotEmail") as HTMLInputElement;
        if (!emailEl?.value) {
          setButtonLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/v1/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailEl.value })
        });

        const data = await res.json().catch(() => ({}));
        setServerMessageType(res.ok ? "success" : "error");
        setServerMessage(data.message || "Something went wrong.");
        if (res.ok) {
          emailEl.value = "";
        }
      }
    } catch (err) {
      console.error(err);
      setServerMessageType("error");
      setServerMessage("An error occurred. Please try again.");
    } finally {
      setButtonLoading(false);
    }
  }

  useEffect(() => {
    setServerMessage(null);
  }, [activeTab]);

  const handleOAuth = async (provider: "google" | "github") => {
    setButtonLoading(true);
    try {
      await signIn(provider);
    } catch (e) {
      console.error(e);
      setServerMessageType("error");
      setServerMessage(`Failed to log in with ${provider}.`);
      setButtonLoading(false);
    }
  };

  return (
    <>
      <input type="checkbox" id="auth-modal" className="modal-toggle" ref={modalToggleRef} />

      <label
        htmlFor="auth-modal"
        className={"modal" + (session?.user === null ? " modal-open" : "")}
      >
        <label className="modal-box flex max-w-sm flex-col gap-4 pt-2">
          {session?.user?.id ? (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex w-full justify-between items-center mb-2">
                <div>
                  Logged in as <b>{session.user.name}</b>
                  {session.user.subscriptionStatus === "active" && (
                    <span className="badge badge-primary badge-sm ml-2 font-bold">PRO</span>
                  )}
                </div>
                <a className="link text-error font-semibold text-sm" onClick={clickLogout}>
                  Logout
                </a>
              </div>
              <div className="flex w-full flex-col gap-1">
                <Link
                  className="btn btn-ghost gap-1 normal-case justify-start"
                  href={`/user/${session.user.name}`}
                  onClick={() => { if (modalToggleRef.current) modalToggleRef.current.checked = false; }}
                >
                  <IconUserCircle /> View profile
                </Link>
                <Link
                  className="btn btn-ghost gap-1 normal-case justify-start"
                  href="/settings"
                  onClick={() => { if (modalToggleRef.current) modalToggleRef.current.checked = false; }}
                >
                  <IconSettings2 /> Account settings
                </Link>
                {session.user.subscriptionStatus !== "active" && (
                  <label
                    htmlFor="upgrade-modal"
                    className="btn btn-primary btn-sm gap-1 normal-case w-full mt-2 font-semibold justify-center"
                    onClick={() => { if (modalToggleRef.current) modalToggleRef.current.checked = false; }}
                  >
                    ⭐ Upgrade to Pro
                  </label>
                )}
              </div>

              <div className="modal-action">
                <label htmlFor="auth-modal" className="btn btn-sm">
                  Close
                </label>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              {activeTab !== "forgot" && (
                <div className="tabs w-full grid grid-cols-3 mb-2">
                  <button
                    type="button"
                    className={`tab tab-bordered ${activeTab === "guest" ? "tab-active font-bold" : ""}`}
                    onClick={() => setActiveTab("guest")}
                  >
                    Guest
                  </button>
                  <button
                    type="button"
                    className={`tab tab-bordered ${activeTab === "login" ? "tab-active font-bold" : ""}`}
                    onClick={() => setActiveTab("login")}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`tab tab-bordered ${activeTab === "register" ? "tab-active font-bold" : ""}`}
                    onClick={() => setActiveTab("register")}
                  >
                    Register
                  </button>
                </div>
              )}

              <form className="flex flex-col px-2 gap-2" onSubmit={submitAuth}>
                {activeTab === "guest" && (
                  <Guest currentName={session?.user?.name || "Guest"} />
                )}

                {activeTab === "login" && (
                  <>
                    <Login />
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("forgot")}
                        className="link link-primary text-xs"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </>
                )}

                {activeTab === "register" && <Register />}

                {activeTab === "forgot" && (
                  <div className="form-control">
                    <h3 className="font-bold text-sm mb-2">Recover Password</h3>
                    <label htmlFor="forgotEmail" className="label py-1">
                      <span className="label-text text-xs">Enter your email address</span>
                    </label>
                    <input
                      type="email"
                      id="forgotEmail"
                      name="forgotEmail"
                      placeholder="email@example.com"
                      className="input input-bordered"
                      required
                    />
                    <div className="text-left mt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="link link-primary text-xs"
                      >
                        Back to Login
                      </button>
                    </div>
                  </div>
                )}

                {serverMessage && (
                  <div className={`text-xs mt-2 font-medium ${serverMessageType === "success" ? "text-success" : "text-error"}`}>
                    {serverMessage}
                  </div>
                )}

                {/* OAuth providers */}
                {(activeTab === "login" || activeTab === "register") && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-base-300">
                    <div className="text-xs text-base-content/50 text-center mb-1">Or log in with</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOAuth("google")}
                        className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1 normal-case"
                      >
                        <IconBrandGoogle size={16} /> Google
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOAuth("github")}
                        className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1 normal-case"
                      >
                        <IconBrandGithub size={16} /> GitHub
                      </button>
                    </div>
                  </div>
                )}

                <div className="modal-action items-center mt-6">
                  {session?.user !== null && session?.user !== undefined && (
                    <label htmlFor="auth-modal" className="btn btn-sm btn-ghost">
                      Close
                    </label>
                  )}
                  <button className={`btn btn-sm btn-primary ${buttonLoading ? "loading" : ""}`} type="submit">
                    {activeTab === "guest" && "Confirm Guest"}
                    {activeTab === "login" && "Log In"}
                    {activeTab === "register" && "Register"}
                    {activeTab === "forgot" && "Send Reset Link"}
                  </button>
                </div>
              </form>
            </>
          )}
        </label>
      </label>
    </>
  );
}
