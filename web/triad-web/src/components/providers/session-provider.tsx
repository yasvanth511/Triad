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

import {
  deleteAccount as deleteAccountRequest,
  getCurrentProfile,
  login as loginRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
} from "@/lib/api/services";
import type { SessionPhase, UpdateProfileRequest, UserProfile } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";

type SessionContextValue = {
  phase: SessionPhase;
  token: string | null;
  currentUser: UserProfile | null;
  isAuthenticating: boolean;
  isHydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfileRequest) => Promise<UserProfile>;
  deleteAccount: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const authTokenKey = "triad.web.auth-token";

export function SessionProvider({ children }: PropsWithChildren) {
  const { value: token, setValue: setToken, hasHydrated } = useLocalStorage<string | null>(
    authTokenKey,
    null,
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null | undefined>(undefined);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !token) {
      return;
    }

    let isCancelled = false;

    getCurrentProfile(token)
      .then((user) => {
        if (isCancelled) {
          return;
        }

        setCurrentUser(user);
      })
      .catch((error: Error) => {
        if (isCancelled) {
          return;
        }

        toast.error(error.message || "Your session expired.");
        setToken(null);
        setCurrentUser(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [hasHydrated, setToken, token]);

  const phase: SessionPhase = !hasHydrated
    ? "loading"
    : token
      ? currentUser === undefined
        ? "loading"
        : "authenticated"
      : "signedOut";

  const value = useMemo<SessionContextValue>(
    () => ({
      phase,
      token,
      currentUser: currentUser ?? null,
      isAuthenticating,
      isHydrated: hasHydrated,
      async signIn(email, password) {
        setIsAuthenticating(true);

        try {
          const response = await loginRequest(email, password);
          setToken(response.token);
          setCurrentUser(response.user);
          toast.success("Welcome back.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Sign in failed.");
          throw error;
        } finally {
          setIsAuthenticating(false);
        }
      },
      async register(username, email, password) {
        setIsAuthenticating(true);

        try {
          const response = await registerRequest(username, email, password);
          setToken(response.token);
          setCurrentUser(response.user);
          toast.success("Your account is ready.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Registration failed.");
          throw error;
        } finally {
          setIsAuthenticating(false);
        }
      },
      signOut() {
        setToken(null);
        setCurrentUser(null);
      },
      async refreshProfile() {
        if (!token) {
          return;
        }

        const user = await getCurrentProfile(token);
        setCurrentUser(user);
      },
      async updateProfile(payload) {
        if (!token) {
          throw new Error("You need to be signed in.");
        }

        const updatedUser = await updateProfileRequest(token, payload);
        setCurrentUser(updatedUser);
        toast.success("Profile updated.");
        return updatedUser;
      },
      async deleteAccount() {
        if (!token) {
          return;
        }

        await deleteAccountRequest(token);
        setToken(null);
        setCurrentUser(null);
        toast.success("Your account has been deleted.");
      },
    }),
    [currentUser, hasHydrated, isAuthenticating, phase, setToken, token],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}
