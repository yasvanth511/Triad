import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, removeToken, setToken } from "../services/api";
import type { AuthResponse, UserProfile } from "../types";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const stored = await getToken();
      if (stored) {
        setTokenState(stored);
        const profile = await api.get<UserProfile>("/profile");
        setUser(profile);
      }
    } catch {
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    await setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  }

  async function register(username: string, email: string, password: string) {
    const res = await api.post<AuthResponse>("/auth/register", {
      username,
      email,
      password,
    });
    await setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  }

  async function logout() {
    await removeToken();
    setTokenState(null);
    setUser(null);
  }

  async function refreshProfile() {
    const profile = await api.get<UserProfile>("/profile");
    setUser(profile);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
