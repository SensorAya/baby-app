export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type TokenVerification = {
  user: User;
  token_created_at: string;
  token_expires_at: string | null;
};

export type MonitoringPeriod = "session" | "daily" | "weekly" | "monthly";

export type MonitoringSessionSummary = {
  key: string;
  period: MonitoringPeriod;
  session_id: string | null;
  started_at: number;
  ended_at: number;
  duration_seconds: number;
  session_count: number;
  sample_count: number;
  average_face_ratio: number | null;
  average_baby_ratio: number | null;
  average_activity_level: number | null;
  stationary_sample_count: number;
  minor_activity_sample_count: number;
  major_activity_sample_count: number;
  alarm_event_count: number;
};

export type MonitoringHistory = {
  items: MonitoringSessionSummary[];
  period: MonitoringPeriod;
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type ReportPeriod = MonitoringPeriod;

export type CalendarReportPeriod = Exclude<ReportPeriod, "session">;

export type ReportQuery =
  | {
      period: "session";
      sessionId: string;
    }
  | {
      period: CalendarReportPeriod;
      anchorDate: string;
    };

export type MonitoringReport = {
  period: ReportPeriod;
  days: number;
  start_at: string;
  end_at: string;
  sample_count: number;
  session_id: string | null;
  report: string;
};

export type SavedMonitoringReport = {
  cacheKey: string;
  userId: string;
  savedAt: string;
  query: ReportQuery;
  report: MonitoringReport;
};

export type AlarmTransition = "triggered" | "cleared";

export type AlarmEvent = {
  id: string;
  user_id: string;
  session_id: string | null;
  timestamp: number;
  event: AlarmTransition;
  face_ratio: number;
  baby_ratio: number;
  created_at: string;
};

export type AlarmState = {
  active: boolean;
  alarm: AlarmEvent | null;
};

export type AlarmStreamMessage = AlarmState & {
  type: "state" | "alarm";
};
