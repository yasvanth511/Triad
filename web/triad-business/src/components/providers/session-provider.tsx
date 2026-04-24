"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";

import { getMe, loginBusiness, registerBusiness } from "@/lib/api/services";
import type { BusinessPartner, SessionPhase, UserProfile } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";

type SessionContextValue = {
  phase: SessionPhase;
  token: string | null;
  currentUser: UserProfile | null;
  partner: BusinessPartner | null;
  isAuthenticating: boolean;
  isHydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshPartner: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const authTokenKey = "triad.business.auth-token";

export function SessionProvider({ children }: PropsWithChildren) {
  const { value: token, setValue: setToken, hasHydrated } = useLocalStorage<string | null>(
    authTokenKey,
    null,
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null | undefined>(undefined);
  const [partner, setPartner] = useState<BusinessPartner | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !token) {
      if (hasHydrated && !token) setCurrentUser(null);
      return;
    }

    let cancelled = false;

    getMe(token)
      .then((p) => {
        if (cancelled) return;
        setPartner(p);
        setCurrentUser({ id: p.userId, username: p.username, email: p.email });
      })
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setCurrentUser(null);
      });

    return () => { cancelled = true; };
  }, [hasHydrated, setToken, token]);

  const phase: SessionPhase = !hasHydrated
    ? "loading"
    : token
      ? currentUser === undefined
        ? "loading"
        : "authenticated"
      : "signedOut";

  const value = useMemo<SessionContextValue>(() => ({
    phase,
    token,
    currentUser: currentUser ?? null,
    partner,
    isAuthenticating,
    isHydrated: hasHydrated,
    async signIn(email, password) {
      setIsAuthenticating(true);
      try {
        const res = await loginBusiness(email, password);
        setToken(res.token);
        setCurrentUser({ id: res.user.id, username: res.user.username });
        toast.success("Welcome back.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign in failed.");
        throw err;
      } finally {
        setIsAuthenticating(false);
      }
    },
    async register(username, email, password) {
      setIsAuthenticating(true);
      try {
        const res = await registerBusiness(username, email, password);
        setToken(res.token);
        setCurrentUser({ id: res.user.id, username: res.user.username });
        toast.success("Account created.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Registration failed.");
        throw err;
      } finally {
        setIsAuthenticating(false);
      }
    },
    signOut() {
      setToken(null);
      setCurrentUser(null);
      setPartner(null);
    },
    async refreshPartner() {
      if (!token) return;
      const p = await getMe(token);
      setPartner(p);
    },
  }), [currentUser, hasHydrated, isAuthenticating, partner, phase, setToken, token]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider.");
  return ctx;
}
