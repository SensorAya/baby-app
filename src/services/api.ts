import Constants from "expo-constants";

import type {
  AlarmState,
  MonitoringHistory,
  MonitoringPeriod,
  MonitoringReport,
  ReportQuery,
  TokenVerification
} from "../models/types";

type ErrorPayload = { detail?: string | Array<{ msg?: string }> };

const configuredUrl = Constants.expoConfig?.extra?.apiUrl;

export const API_URL =
  typeof configuredUrl === "string" && configuredUrl.length > 0
    ? configuredUrl.replace(/\/$/, "")
    : "http://10.0.2.2:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  token: string,
  init?: RequestInit,
  timeoutMs = 60_000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      let payload: ErrorPayload | undefined;
      try {
        payload = (await response.json()) as ErrorPayload;
      } catch {
        payload = undefined;
      }
      const detail = Array.isArray(payload?.detail)
        ? payload.detail.map((item) => item.msg).filter(Boolean).join("；")
        : payload?.detail;
      throw new ApiError(detail || `请求失败（${response.status}）`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("请求超时，请检查网络后重试", 408);
    }
    throw new ApiError("无法连接后端服务，请检查设备网络与服务器地址", 0);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  verifyToken: (token: string) =>
    request<TokenVerification>("/api/verify-token", token),
  getMonitoringHistory: (
    token: string,
    period: MonitoringPeriod,
    page: number,
    pageSize = 20
  ) =>
    request<MonitoringHistory>(
      `/api/monitoring/history?period=${period}&page=${page}&page_size=${pageSize}`,
      token
    ),
  getActiveAlarm: (token: string) =>
    request<AlarmState>("/api/alarms/active", token),
  generateReport: (token: string, query: ReportQuery) =>
    request<MonitoringReport>("/api/reports", token, {
      method: "POST",
      body: JSON.stringify({
        period: query.period,
        ...(query.period === "session" ? { session_id: query.sessionId } : {})
      })
    }, 120_000)
};

export function createAlarmWebSocket(token: string): WebSocket {
  const websocketUrl = `${API_URL.replace(/^http/i, "ws")}/api/alarms/ws`;
  return new WebSocket(websocketUrl, ["bearer", token]);
}
