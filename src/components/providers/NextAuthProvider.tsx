"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useESignStore } from "@/lib/store";

interface NextAuthProviderProps {
  children: React.ReactNode;
}

function SessionSyncer() {
  const { data: session, status } = useSession();
  const { user, login, logout } = useESignStore();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (!user.loggedIn || user.email !== session.user.email) {
        login(
          session.user.name || "User",
          session.user.email || "",
          "google"
        );
      }
    } else if (status === "unauthenticated" && user.loggedIn) {
      logout();
    }
  }, [session, status, user.loggedIn, user.email, login, logout]);

  return null;
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
  return (
    <SessionProvider>
      <SessionSyncer />
      {children}
    </SessionProvider>
  );
}
