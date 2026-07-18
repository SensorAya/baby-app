import { useCallback, useState } from "react";

import type { MonitoringReport, ReportPeriod } from "../models/types";
import { api, ApiError } from "../services/api";
import { useAuthViewModel } from "./AuthViewModel";

export function useReportViewModel() {
  const { token, signOut } = useAuthViewModel();
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!token || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      setReport(await api.generateReport(token, period));
    } catch (generateError) {
      if (generateError instanceof ApiError && generateError.status === 401) {
        await signOut();
        return;
      }
      if (generateError instanceof ApiError && generateError.status === 404) {
        setError(`最近${period === "weekly" ? " 7 " : " 30 "}天没有监测数据`);
      } else if (generateError instanceof ApiError && generateError.status === 502) {
        setError("报告服务暂时不可用，请稍后重试");
      } else {
        setError(
          generateError instanceof Error ? generateError.message : "生成报告失败"
        );
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, period, signOut, token]);

  const changePeriod = useCallback((nextPeriod: ReportPeriod) => {
    setPeriod(nextPeriod);
    setReport(null);
    setError(null);
  }, []);

  return {
    period,
    report,
    isGenerating,
    error,
    setPeriod: changePeriod,
    generate
  };
}
