"use client";

import { SessionContext } from "@/context/session";
import { logout, setGuestSession } from "@/lib/auth";
import Link from "next/link";
import type { FormEvent } from "react";
import { useContext, useEffect, useRef, useState } from "react";

import { IconSettings2, IconUserCircle } from "@tabler/icons-react";
import Guest from "./Guest";

export default function AuthModal() {
  const session = useContext(SessionContext);
  const [activeTab, setActiveTab] = useState<"guest" | "login" | "register">("guest");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const modalToggleRef = useRef<HTMLInputElement>(null);

  async function clickLogout() {
    if (serverMessage) {
      setServerMessage(null);
    }
    setActiveTab("login");
    await logout();
    session?.setUser(null);
  }

  async function submitAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as HTMLFormElement;
    if (activeTab === "guest") {
      const guestName = target.elements.namedItem("guestName") as HTMLInputElement;
      if (!guestName || !guestName.value) return;

      setButtonLoading(true);
      const user = await setGuestSession(guestName.value);
      if (user) {
        session?.setUser(user);
        if (modalToggleRef.current?.checked) {
          modalToggleRef.current.checked = false;
        }
      }
      guestName.value = "";
    }
    setButtonLoading(false);
  }

  useEffect(() => {
    setServerMessage(null);
  }, [activeTab]);

  return (
    <>
      <input type="checkbox" id="auth-modal" className="modal-toggle" ref={modalToggleRef} />

      <label
        htmlFor="auth-modal"
        className={"modal" + (session?.user === null ? " modal-open" : "")}
      >
        <label className="modal-box flex max-w-sm flex-col gap-4 pt-2">
          {session?.user?.id && typeof session.user.id === "number" ? (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex w-full justify-between">
                <div>
                  Logged in as <b>{session.user.name}</b>
                </div>
                <a className="link" onClick={clickLogout}>
                  Logout
                </a>
              </div>
              <div className="flex w-full flex-col">
                <Link
                  className="btn btn-ghost gap-1 normal-case"
                  href={`/user/${session.user.name}`}
                  onClick={() => ((modalToggleRef.current as HTMLInputElement).checked = false)}
                >
                  <IconUserCircle /> View profile
                </Link>
                <Link
                  className="btn btn-ghost gap-1 normal-case"
                  href="/settings"
                  onClick={() => ((modalToggleRef.current as HTMLInputElement).checked = false)}
                >
                  <IconSettings2 /> Account settings
                </Link>
              </div>

              <div className="modal-action">
                <label htmlFor="auth-modal" className="btn">
                  Close
                </label>
              </div>
            </div>
          ) : (
            <>
              <form className="flex flex-col px-2" onSubmit={submitAuth}>
                {activeTab === "guest" && (
                  <Guest currentName={session?.user?.name || "unknown user"} />
                )}

                {serverMessage && <div className="text-error mt-2">{serverMessage}</div>}
                <div className="modal-action items-center">
                  {session?.user !== null && (
                    <label htmlFor="auth-modal" className="btn btn-ghost">
                      Close
                    </label>
                  )}
                  <button className={"btn" + (buttonLoading ? " loading" : "")} type="submit">
                    {activeTab === "guest" && "Confirm"}
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
