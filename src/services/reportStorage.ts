import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  CalendarReportPeriod,
  MonitoringReport,
  ReportPeriod,
  ReportQuery,
  SavedMonitoringReport
} from "../models/types";

const STORAGE_PREFIX = "sensoraya.monitoring-reports.v1";
const MAX_SAVED_REPORTS = 100;
const calendarPeriods: ReadonlyArray<CalendarReportPeriod> = [
  "daily",
  "weekly",
  "monthly"
];
const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

let pendingWrite: Promise<void> = Promise.resolve();

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}.${userId}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReportPeriod(value: unknown): value is ReportPeriod {
  return value === "session" || calendarPeriods.includes(value as CalendarReportPeriod);
}

function isReportQuery(value: unknown): value is ReportQuery {
  if (!isObject(value) || !isReportPeriod(value.period)) return false;
  return value.period === "session"
    ? typeof value.sessionId === "string" && value.sessionId.length > 0
    : typeof value.anchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.anchorDate);
}

function isMonitoringReport(value: unknown): value is MonitoringReport {
  return (
    isObject(value) &&
    isReportPeriod(value.period) &&
    typeof value.days === "number" &&
    typeof value.start_at === "string" &&
    typeof value.end_at === "string" &&
    typeof value.sample_count === "number" &&
    (value.session_id === null || typeof value.session_id === "string") &&
    typeof value.report === "string"
  );
}

function isSavedReport(value: unknown, userId: string): value is SavedMonitoringReport {
  return (
    isObject(value) &&
    typeof value.cacheKey === "string" &&
    value.userId === userId &&
    typeof value.savedAt === "string" &&
    isReportQuery(value.query) &&
    isMonitoringReport(value.report)
  );
}

async function readReports(userId: string): Promise<SavedMonitoringReport[]> {
  const key = storageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid report cache");
    return parsed
      .filter((item) => isSavedReport(item, userId))
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  } catch {
    await AsyncStorage.removeItem(key);
    return [];
  }
}

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const result = pendingWrite.then(operation, operation);
  pendingWrite = result.catch(() => undefined);
  return result;
}

export function getTaipeiDateKey(date = new Date()): string {
  return taipeiDateFormatter.format(date);
}

export function createCalendarReportQuery(
  period: CalendarReportPeriod,
  date = new Date()
): ReportQuery {
  return { period, anchorDate: getTaipeiDateKey(date) };
}

export function createSessionReportQuery(sessionId: string): ReportQuery {
  return { period: "session", sessionId };
}

export function getReportCacheKey(query: ReportQuery): string {
  return query.period === "session"
    ? `session:${query.sessionId}`
    : `${query.period}:${query.anchorDate}`;
}

export function canRegenerateReport(query: ReportQuery): boolean {
  return query.period === "session" || query.anchorDate === getTaipeiDateKey();
}

export function createSavedReport(
  userId: string,
  query: ReportQuery,
  report: MonitoringReport
): SavedMonitoringReport {
  return {
    cacheKey: getReportCacheKey(query),
    userId,
    savedAt: new Date().toISOString(),
    query,
    report
  };
}

export const reportStorage = {
  list(userId: string): Promise<SavedMonitoringReport[]> {
    return readReports(userId);
  },

  async get(
    userId: string,
    query: ReportQuery
  ): Promise<SavedMonitoringReport | null> {
    const cacheKey = getReportCacheKey(query);
    const reports = await readReports(userId);
    return reports.find((item) => item.cacheKey === cacheKey) ?? null;
  },

  save(savedReport: SavedMonitoringReport): Promise<void> {
    return enqueueWrite(async () => {
      const reports = await readReports(savedReport.userId);
      const nextReports = [
        savedReport,
        ...reports.filter((item) => item.cacheKey !== savedReport.cacheKey)
      ].slice(0, MAX_SAVED_REPORTS);
      await AsyncStorage.setItem(
        storageKey(savedReport.userId),
        JSON.stringify(nextReports)
      );
    });
  },

  remove(userId: string, cacheKey: string): Promise<void> {
    return enqueueWrite(async () => {
      const reports = await readReports(userId);
      await AsyncStorage.setItem(
        storageKey(userId),
        JSON.stringify(reports.filter((item) => item.cacheKey !== cacheKey))
      );
    });
  }
};
