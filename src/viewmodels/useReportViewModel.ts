import { useCallback, useEffect, useRef, useState } from "react";

import type { MonitoringReport, ReportPeriod } from "../models/types";
import { api, ApiError } from "../services/api";
import { shareMonitoringReport } from "../services/reportSharing";
import { useAuthViewModel } from "./AuthViewModel";

export function useReportViewModel() {
  const { token, signOut } = useAuthViewModel();
  const [period, setPeriod] = useState<ReportPeriod>("session");
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const requestId = useRef(0);
  const generatingRequest = useRef<number | null>(null);
  const sharing = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
      generatingRequest.current = null;
      sharing.current = false;
    };
  }, []);

  const generate = useCallback(async () => {
    if (!token || generatingRequest.current !== null) return;
    const currentRequest = ++requestId.current;
    const requestedPeriod = period;
    generatingRequest.current = currentRequest;
    setIsGenerating(true);
    setError(null);
    setShareError(null);
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
        const labels: Record<ReportPeriod, string> = {
          session: "最近没有完整监测",
          daily: "今天没有完整监测",
          weekly: "最近 7 天没有完整监测",
          monthly: "最近 30 天没有完整监测"
        };
        setError(labels[requestedPeriod]);
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
      setShareError(null);
    },
    [period]
  );

  const share = useCallback(async () => {
    if (!report || sharing.current) return;
    sharing.current = true;
    setIsSharing(true);
    setShareError(null);
    try {
      await shareMonitoringReport(report);
    } catch {
      if (mounted.current) {
        setShareError("无法打开系统分享面板，请稍后重试");
      }
    } finally {
      sharing.current = false;
      if (mounted.current) setIsSharing(false);
    }
  }, [report]);

  return {
    period,
    report,
    isGenerating,
    isSharing,
    error,
    shareError,
    setPeriod: changePeriod,
    generate,
    share
  };
}
