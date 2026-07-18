import { useCallback, useEffect, useRef, useState } from "react";

import type { MonitoringRecord } from "../models/types";
import { api, ApiError } from "../services/api";
import { useAuthViewModel } from "./AuthViewModel";

const PAGE_SIZE = 20;

export function useMonitoringHistoryViewModel() {
  const { token, signOut } = useAuthViewModel();
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadPage = useCallback(
    async (nextPage: number, mode: "initial" | "refresh" | "more") => {
      if (!token) return;
      const currentRequest = ++requestId.current;
      if (mode === "initial") setIsLoading(true);
      if (mode === "refresh") setIsRefreshing(true);
      if (mode === "more") setIsLoadingMore(true);
      setError(null);

      try {
        const result = await api.getMonitoringHistory(token, nextPage, PAGE_SIZE);
        if (currentRequest !== requestId.current) return;
        setRecords((current) =>
          mode === "more" ? [...current, ...result.items] : result.items
        );
        setTotal(result.total);
        setPage(result.page);
        setPages(result.pages);
      } catch (loadError) {
        if (currentRequest !== requestId.current) return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          await signOut();
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "读取历史记录失败");
      } finally {
        if (currentRequest === requestId.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [signOut, token]
  );

  useEffect(() => {
    if (token) void loadPage(1, "initial");
    return () => {
      requestId.current += 1;
    };
  }, [loadPage, token]);

  const refresh = useCallback(() => loadPage(1, "refresh"), [loadPage]);
  const loadMore = useCallback(() => {
    if (!isLoadingMore && page < pages) return loadPage(page + 1, "more");
    return Promise.resolve();
  }, [isLoadingMore, loadPage, page, pages]);

  return {
    records,
    total,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore: page < pages,
    error,
    refresh,
    loadMore,
    retry: () => loadPage(1, "initial")
  };
}
