import { Share } from "react-native";

import type { MonitoringReport } from "../models/types";

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

function reportTitle(report: MonitoringReport): string {
  return {
    session: "SensorAya 婴儿单次监测报告",
    daily: "SensorAya 婴儿监控日报",
    weekly: "SensorAya 婴儿监控周报",
    monthly: "SensorAya 婴儿监控月报"
  }[report.period];
}

export async function shareMonitoringReport(
  report: MonitoringReport
): Promise<void> {
  const title = reportTitle(report);
  const dateRange = `${dateFormatter.format(
    new Date(report.start_at)
  )} – ${dateFormatter.format(new Date(report.end_at))}`;
  const message = [
    title,
    `${dateRange} · ${report.sample_count} 条监测样本`,
    "",
    report.report
  ].join("\n");

  await Share.share(
    { title, message },
    { dialogTitle: `分享${title.replace("SensorAya 婴儿", "")}` }
  );
}
