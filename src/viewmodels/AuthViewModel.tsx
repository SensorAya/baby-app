import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";

import type { User } from "../models/types";
import { api, ApiError } from "../services/api";
import { tokenStorage } from "../services/tokenStorage";

type AuthStatus =
  | "restoring"
  | "restoreFailed"
  | "signedOut"
  | "verifying"
  | "signedIn";

type AuthViewModel = {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  error: string | null;
  signIn: (token: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  retryRestore: () => Promise<void>;
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
  const requestId = useRef(0);

  const clearSession = useCallback(async () => {
    requestId.current += 1;
    let clearError: string | null = null;
    try {
      await tokenStorage.clear();
    } catch {
      clearError = "无法清除本机凭证，请稍后重试或在系统设置中清除应用数据";
    }
    setToken(null);
    setUser(null);
    setError(clearError);
    setStatus("signedOut");
  }, []);

  const restoreSession = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setStatus("restoring");
    setError(null);

    let savedToken: string | null;
    try {
      savedToken = await tokenStorage.get();
    } catch {
      if (currentRequest !== requestId.current) return;
      setToken(null);
      setUser(null);
      setError("无法读取本机保存的 Token，请解锁设备后重试");
      setStatus("restoreFailed");
      return;
    }

    if (currentRequest !== requestId.current) return;
    if (!savedToken) {
      setToken(null);
      setUser(null);
      setStatus("signedOut");
      return;
    }

    setToken(savedToken);
    setUser(null);
    try {
      const verified = await api.verifyToken(savedToken);
      if (currentRequest !== requestId.current) return;
      setUser(verified.user);
      setStatus("signedIn");
    } catch (restoreError) {
      if (currentRequest !== requestId.current) return;
      if (restoreError instanceof ApiError && restoreError.status === 401) {
        let storageError: string | null = null;
        try {
          await tokenStorage.clear();
        } catch {
          storageError = "Token 已失效，但本机凭证清除失败；可输入新 Token 覆盖";
        }
        if (currentRequest !== requestId.current) return;
        setToken(null);
        setUser(null);
        setError(storageError);
        setStatus("signedOut");
        return;
      }

      setError(getLoginError(restoreError));
      setStatus("restoreFailed");
    }
  }, []);

  useEffect(() => {
    void restoreSession();

    return () => {
      requestId.current += 1;
    };
  }, [restoreSession]);

  const signIn = useCallback(async (rawToken: string) => {
    const nextToken = rawToken.trim();
    if (!nextToken) {
      setError("请输入永久 Token");
      return false;
    }

    setError(null);
    setStatus("verifying");
    const currentRequest = ++requestId.current;
    try {
      const verified = await api.verifyToken(nextToken);
      if (currentRequest !== requestId.current) return false;
      await tokenStorage.set(nextToken);
      if (currentRequest !== requestId.current) return false;
      setToken(nextToken);
      setUser(verified.user);
      setStatus("signedIn");
      return true;
    } catch (loginError) {
      if (currentRequest !== requestId.current) return false;
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
      retryRestore: restoreSession,
      clearError: () => setError(null)
    }),
    [clearSession, error, restoreSession, signIn, status, token, user]
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
