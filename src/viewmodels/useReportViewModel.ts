import { useCallback, useEffect, useRef, useState } from "react";

import type { ReportQuery, SavedMonitoringReport } from "../models/types";
import { api, ApiError } from "../services/api";
import {
  canRegenerateReport,
  createSavedReport,
  getReportCacheKey,
  reportStorage
} from "../services/reportStorage";
import { shareMonitoringReport } from "../services/reportSharing";
import { useAuthViewModel } from "./AuthViewModel";

type UseReportViewModelOptions = {
  query: ReportQuery;
  initialReport?: SavedMonitoringReport | null;
};

function getGenerateError(error: unknown, query: ReportQuery): string {
  if (error instanceof ApiError && error.status === 404) {
    return {
      session: "这次监测没有可用于分析的完整数据",
      daily: "今天没有完整监测",
      weekly: "最近 7 天没有完整监测",
      monthly: "最近 30 天没有完整监测"
    }[query.period];
  }
  if (error instanceof ApiError && error.status === 502) {
    return "报告服务暂时不可用，请稍后重试";
  }
  return error instanceof Error ? error.message : "生成报告失败";
}

export function useReportViewModel({
  query,
  initialReport = null
}: UseReportViewModelOptions) {
  const { token, user, signOut } = useAuthViewModel();
  const queryKey = getReportCacheKey(query);
  const [savedReport, setSavedReport] = useState<SavedMonitoringReport | null>(
    initialReport?.cacheKey === queryKey ? initialReport : null
  );
  const [isRestoring, setIsRestoring] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
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

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const initial =
      initialReport?.cacheKey === queryKey ? initialReport : null;
    setSavedReport(initial);
    setError(null);
    setStorageNotice(null);
    setShareError(null);

    if (!user) {
      setIsRestoring(false);
      return;
    }

    setIsRestoring(true);
    void reportStorage
      .get(user.id, query)
      .then((stored) => {
        if (currentRequest === requestId.current) {
          setSavedReport(stored ?? initial);
        }
      })
      .catch(() => {
        if (currentRequest === requestId.current) {
          setStorageNotice("无法读取本机报告，但仍可重新生成");
        }
      })
      .finally(() => {
        if (currentRequest === requestId.current) setIsRestoring(false);
      });
  }, [initialReport, query, queryKey, user]);

  const canGenerate = canRegenerateReport(query);

  const generate = useCallback(async () => {
    if (
      !token ||
      !user ||
      !canGenerate ||
      generatingRequest.current !== null
    ) {
      return;
    }

    const currentRequest = ++requestId.current;
    generatingRequest.current = currentRequest;
    setIsGenerating(true);
    setError(null);
    setStorageNotice(null);
    setShareError(null);

    try {
      const generatedReport = await api.generateReport(token, query);
      const nextSavedReport = createSavedReport(
        user.id,
        query,
        generatedReport
      );
      let saveFailed = false;
      try {
        await reportStorage.save(nextSavedReport);
      } catch {
        saveFailed = true;
      }

      if (currentRequest !== requestId.current) return;
      setSavedReport(nextSavedReport);
      if (saveFailed) {
        setStorageNotice("报告已生成，但保存到本机失败");
      }
    } catch (generateError) {
      if (currentRequest !== requestId.current) return;
      if (generateError instanceof ApiError && generateError.status === 401) {
        await signOut();
        return;
      }
      setError(getGenerateError(generateError, query));
    } finally {
      if (generatingRequest.current === currentRequest) {
        generatingRequest.current = null;
        if (mounted.current) setIsGenerating(false);
      }
    }
  }, [canGenerate, query, signOut, token, user]);

  const share = useCallback(async () => {
    if (!savedReport || sharing.current) return;
    sharing.current = true;
    setIsSharing(true);
    setShareError(null);
    try {
      await shareMonitoringReport(savedReport.report);
    } catch {
      if (mounted.current) {
        setShareError("无法打开系统分享面板，请稍后重试");
      }
    } finally {
      sharing.current = false;
      if (mounted.current) setIsSharing(false);
    }
  }, [savedReport]);

  return {
    savedReport,
    isRestoring,
    isGenerating,
    isSharing,
    canGenerate,
    error,
    storageNotice,
    shareError,
    generate,
    share
  };
}

export function useReportLibraryViewModel() {
  const { user } = useAuthViewModel();
  const [reports, setReports] = useState<SavedMonitoringReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!user) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setActionError(null);
    try {
      const storedReports = await reportStorage.list(user.id);
      if (currentRequest === requestId.current) setReports(storedReports);
    } catch {
      if (currentRequest === requestId.current) {
        setError("无法读取保存在本机的报告");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  const removeSavedReport = useCallback(
    async (savedReport: SavedMonitoringReport) => {
      if (!user) return false;
      setActionError(null);
      try {
        await reportStorage.remove(user.id, savedReport.cacheKey);
        setReports((current) =>
          current.filter((item) => item.cacheKey !== savedReport.cacheKey)
        );
        return true;
      } catch {
        setActionError("无法删除这份本机报告，请稍后重试");
        return false;
      }
    },
    [user]
  );

  const shareSavedReport = useCallback(
    async (savedReport: SavedMonitoringReport) => {
      setActionError(null);
      try {
        await shareMonitoringReport(savedReport.report);
      } catch {
        setActionError("无法打开系统分享面板，请稍后重试");
      }
    },
    []
  );

  return {
    reports,
    isLoading,
    error,
    actionError,
    refresh,
    removeSavedReport,
    shareSavedReport
  };
}
