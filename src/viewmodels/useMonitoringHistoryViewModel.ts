import { useCallback, useEffect, useRef, useState } from "react";

import type { MonitoringRecord } from "../models/types";
import { api, ApiError } from "../services/api";
import { useAuthViewModel } from "./AuthViewModel";

const PAGE_SIZE = 20;

function mergeRecords(
  current: MonitoringRecord[],
  incoming: MonitoringRecord[]
): MonitoringRecord[] {
  const recordsById = new Map(current.map((record) => [record.id, record]));
  for (const record of incoming) recordsById.set(record.id, record);
  return [...recordsById.values()].sort(
    (left, right) =>
      right.timestamp - left.timestamp || right.id.localeCompare(left.id)
  );
}

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
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const requestId = useRef(0);
  const loadingMore = useRef(false);

  const loadPage = useCallback(
    async (nextPage: number, mode: "initial" | "refresh" | "more") => {
      if (!token) return;
      const currentRequest = ++requestId.current;
      if (mode === "initial") setIsLoading(true);
      if (mode === "refresh") setIsRefreshing(true);
      if (mode === "more") {
        loadingMore.current = true;
        setIsLoadingMore(true);
        setLoadMoreError(null);
      } else {
        setError(null);
        setLoadMoreError(null);
      }

      try {
        const result = await api.getMonitoringHistory(token, nextPage, PAGE_SIZE);
        if (currentRequest !== requestId.current) return;
        setRecords((current) =>
          mode === "more" ? mergeRecords(current, result.items) : result.items
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
        const message =
          loadError instanceof Error ? loadError.message : "读取历史记录失败";
        if (mode === "more") setLoadMoreError(message);
        else setError(message);
      } finally {
        if (mode === "more") loadingMore.current = false;
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
    if (!loadingMore.current && page < pages) return loadPage(page + 1, "more");
    return Promise.resolve();
  }, [loadPage, page, pages]);

  const loadedAlarmCount = records.reduce(
    (count, record) => count + (record.alarm_active ? 1 : 0),
    0
  );

  return {
    records,
    total,
    loadedAlarmCount,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore: page < pages,
    error,
    loadMoreError,
    refresh,
    loadMore,
    retry: () => loadPage(1, "initial")
  };
}
