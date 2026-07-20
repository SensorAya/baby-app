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

export type MonitoringRecord = {
  id: string;
  user_id: string;
  timestamp: number;
  face_ratio: number;
  face_center_x: number;
  face_center_y: number;
  alarm_active: boolean;
  baby_center_x: number;
  baby_center_y: number;
  baby_ratio: number;
  created_at: string;
};

export type MonitoringHistory = {
  items: MonitoringRecord[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type ReportPeriod = "weekly" | "monthly";

export type MonitoringReport = {
  period: ReportPeriod;
  days: number;
  start_at: string;
  end_at: string;
  sample_count: number;
  report: string;
};
