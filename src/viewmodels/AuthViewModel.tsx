import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import type { User } from "../models/types";
import { api, ApiError } from "../services/api";
import { tokenStorage } from "../services/tokenStorage";

type AuthStatus = "restoring" | "signedOut" | "verifying" | "signedIn";

type AuthViewModel = {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  error: string | null;
  signIn: (token: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthViewModel | null>(null);

function getLoginError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return "这个 Token 无效或已失效，请检查后重试";
  }
  return error instanceof Error ? error.message : "登录失败，请稍后重试";
}

export function AuthViewModelProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("restoring");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    await tokenStorage.clear();
    setToken(null);
    setUser(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const savedToken = await tokenStorage.get();
      if (!active) return;
      if (!savedToken) {
        setStatus("signedOut");
        return;
      }

      try {
        const verified = await api.verifyToken(savedToken);
        if (!active) return;
        setToken(savedToken);
        setUser(verified.user);
        setStatus("signedIn");
      } catch (restoreError) {
        if (!active) return;
        await clearSession();
        if (!(restoreError instanceof ApiError && restoreError.status === 401)) {
          setError(getLoginError(restoreError));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [clearSession]);

  const signIn = useCallback(async (rawToken: string) => {
    const nextToken = rawToken.trim();
    if (!nextToken) {
      setError("请输入永久 Token");
      return false;
    }

    setError(null);
    setStatus("verifying");
    try {
      const verified = await api.verifyToken(nextToken);
      await tokenStorage.set(nextToken);
      setToken(nextToken);
      setUser(verified.user);
      setStatus("signedIn");
      return true;
    } catch (loginError) {
      setStatus("signedOut");
      setError(getLoginError(loginError));
      return false;
    }
  }, []);

  const value = useMemo<AuthViewModel>(
    () => ({
      status,
      token,
      user,
      error,
      signIn,
      signOut: clearSession,
      clearError: () => setError(null)
    }),
    [clearSession, error, signIn, status, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthViewModel(): AuthViewModel {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthViewModel must be used inside AuthViewModelProvider");
  }
  return context;
}
