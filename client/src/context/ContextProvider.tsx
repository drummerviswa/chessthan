"use client";

import type { User } from "@/types_config/index";
import type { ReactNode } from "react";
import { useEffect, useState, useContext } from "react";
import { SessionProvider, useSession } from "next-auth/react";

import { fetchSession } from "@/lib/auth";
import { SessionContext } from "./session";

// Syncs NextAuth JWT session with the legacy SessionContext
function SessionSyncWrapper({ children }: { children: ReactNode }) {
  const { data: authSession, status } = useSession();
  const session = useContext(SessionContext);

  useEffect(() => {
    // Still fetching JWT from cookie — do nothing yet (keeps "undefined" = loading state)
    if (status === "loading") return;

    if (authSession?.user) {
      // NextAuth confirmed an active session (credentials OR OAuth)
      const u = authSession.user as any;
      session?.setUser({
        id: u.id || u.name || "user",
        name: u.name || "User",
        email: u.email || undefined,
        wins: u.wins || 0,
        losses: u.losses || 0,
        draws: u.draws || 0,
        avatarUrl: u.avatarUrl || u.image || undefined,
        subscriptionStatus: u.subscriptionStatus || undefined,
        puzzleRating: u.puzzleRating || 1200
      });
    } else {
      // NextAuth says no JWT session — try legacy express session cookie (guest users)
      fetchSession()
        .then((user) => {
          // Only set to null if the backend confirms no session either
          session?.setUser(user ?? null);
        })
        .catch(() => {
          // Backend unreachable (cold start etc.) — treat as no session
          session?.setUser(null);
        });
    }
  }, [authSession, status]);

  return <>{children}</>;
}

export default function ContextProvider({ children }: { children: ReactNode }) {
  // Start as undefined = "loading, don't show modal yet"
  const [user, setUser] = useState<User | null | undefined>(undefined);

  return (
    <SessionProvider>
      <SessionContext.Provider value={{ user, setUser }}>
        <SessionSyncWrapper>{children}</SessionSyncWrapper>
      </SessionContext.Provider>
    </SessionProvider>
  );
}
