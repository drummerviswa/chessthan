"use client";

import type { User } from "@/types_config/index";
import type { ReactNode } from "react";
import { useEffect, useState, useContext } from "react";
import { SessionProvider, useSession } from "next-auth/react";

import { fetchSession } from "@/lib/auth";
import { SessionContext } from "./session";

// Syncs Auth.js NextAuth session with the legacy SessionContext state
function SessionSyncWrapper({ children }: { children: ReactNode }) {
  const { data: authSession } = useSession();
  const session = useContext(SessionContext);

  useEffect(() => {
    if (authSession?.user) {
      session?.setUser({
        id: (authSession.user as any).id,
        name: authSession.user.name,
        email: authSession.user.email || undefined,
        wins: (authSession.user as any).wins,
        losses: (authSession.user as any).losses,
        draws: (authSession.user as any).draws,
        avatarUrl: (authSession.user as any).avatarUrl,
        subscriptionStatus: (authSession.user as any).subscriptionStatus,
        puzzleRating: (authSession.user as any).puzzleRating
      });
    } else {
      // Fallback: check if there's an active legacy guest session
      fetchSession().then((user) => {
        if (user) {
          session?.setUser(user);
        } else {
          session?.setUser(null);
        }
      });
    }
  }, [authSession]);

  return <>{children}</>;
}

export default function ContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({});

  return (
    <SessionProvider>
      <SessionContext.Provider value={{ user, setUser }}>
        <SessionSyncWrapper>{children}</SessionSyncWrapper>
      </SessionContext.Provider>
    </SessionProvider>
  );
}
