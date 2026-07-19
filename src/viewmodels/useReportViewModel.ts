import { useCallback, useEffect, useRef, useState } from "react";

import type { MonitoringReport, ReportPeriod } from "../models/types";
import { api, ApiError } from "../services/api";
import { useAuthViewModel } from "./AuthViewModel";

export function useReportViewModel() {
  const { token, signOut } = useAuthViewModel();
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const generatingRequest = useRef<number | null>(null);

  useEffect(
    () => () => {
      requestId.current += 1;
      generatingRequest.current = null;
    },
    []
  );

  const generate = useCallback(async () => {
    if (!token || generatingRequest.current !== null) return;
    const currentRequest = ++requestId.current;
    const requestedPeriod = period;
    generatingRequest.current = currentRequest;
    setIsGenerating(true);
    setError(null);
    try {
      const generatedReport = await api.generateReport(token, requestedPeriod);
      if (currentRequest !== requestId.current) return;
      setReport(generatedReport);
    } catch (generateError) {
      if (currentRequest !== requestId.current) return;
      if (generateError instanceof ApiError && generateError.status === 401) {
        await signOut();
        return;
      }
      if (generateError instanceof ApiError && generateError.status === 404) {
        setError(
          `最近${requestedPeriod === "weekly" ? " 7 " : " 30 "}天没有监测数据`
        );
      } else if (generateError instanceof ApiError && generateError.status === 502) {
        setError("报告服务暂时不可用，请稍后重试");
      } else {
        setError(
          generateError instanceof Error ? generateError.message : "生成报告失败"
        );
      }
    } finally {
      if (generatingRequest.current === currentRequest) {
        generatingRequest.current = null;
        setIsGenerating(false);
      }
    }
  }, [period, signOut, token]);

  const changePeriod = useCallback(
    (nextPeriod: ReportPeriod) => {
      if (nextPeriod === period) return;
      requestId.current += 1;
      generatingRequest.current = null;
      setIsGenerating(false);
      setPeriod(nextPeriod);
      setReport(null);
      setError(null);
    },
    [period]
  );

  return {
    period,
    report,
    isGenerating,
    error,
    setPeriod: changePeriod,
    generate
  };
}
