import { useCallback, useEffect, useRef, useState } from "react";

import type {
  MonitoringPeriod,
  MonitoringSessionSummary
} from "../models/types";
import { api, ApiError } from "../services/api";
import { useAuthViewModel } from "./AuthViewModel";

const PAGE_SIZE = 20;

function mergeItems(
  current: MonitoringSessionSummary[],
  incoming: MonitoringSessionSummary[]
): MonitoringSessionSummary[] {
  const itemsByKey = new Map(current.map((item) => [item.key, item]));
  for (const item of incoming) itemsByKey.set(item.key, item);
  return [...itemsByKey.values()].sort(
    (left, right) => right.ended_at - left.ended_at || right.key.localeCompare(left.key)
  );
}

export function useMonitoringHistoryViewModel() {
  const { token, signOut } = useAuthViewModel();
  const [period, setPeriod] = useState<MonitoringPeriod>("session");
  const [items, setItems] = useState<MonitoringSessionSummary[]>([]);
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
        const result = await api.getMonitoringHistory(
          token,
          period,
          nextPage,
          PAGE_SIZE
        );
        if (currentRequest !== requestId.current) return;
        setItems((current) =>
          mode === "more" ? mergeItems(current, result.items) : result.items
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
          loadError instanceof Error ? loadError.message : "读取监测历史失败";
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
    [period, signOut, token]
  );

  useEffect(() => {
    if (token) void loadPage(1, "initial");
    return () => {
      requestId.current += 1;
    };
  }, [loadPage, token]);

  const changePeriod = useCallback((nextPeriod: MonitoringPeriod) => {
    requestId.current += 1;
    setPeriod(nextPeriod);
    setItems([]);
    setTotal(0);
    setPage(0);
    setPages(0);
  }, []);
  const refresh = useCallback(() => loadPage(1, "refresh"), [loadPage]);
  const loadMore = useCallback(() => {
    if (!loadingMore.current && page < pages) return loadPage(page + 1, "more");
    return Promise.resolve();
  }, [loadPage, page, pages]);

  return {
    period,
    items,
    total,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore: page < pages,
    error,
    loadMoreError,
    setPeriod: changePeriod,
    refresh,
    loadMore,
    retry: () => loadPage(1, "initial")
  };
}
