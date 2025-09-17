"use client";

import { useState, useEffect, useCallback } from "react";

// Types
export interface CloudflarePurgeLog {
  id: number;
  cloudflare_account_id: number | null;
  mode: "url" | "hostname" | "tag" | "prefix";
  payload: string[];
  exclusions?: string[] | null;
  status_code?: number;
  result?: Record<string, unknown>;
  created_at: string;
  created_by?: string;
  accountName?: string;
  cloudflare_accounts?: {
    id: number;
    account_name: string;
    email: string;
  } | null;
}

interface CloudflarePurgeLogsResponse {
  status: "success" | "error";
  data?: CloudflarePurgeLog[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
  details?: Record<string, unknown> | string[];
}

interface UseCloudflareLogsOptions {
  search?: string;
  cloudflare_account_id?: number;
  mode?: "url" | "hostname" | "tag" | "prefix";
  status_filter?: "success" | "error";
  sort?: "created_at" | "mode" | "status_code";
  order?: "asc" | "desc";
  limit?: number;
  page?: number;
}

export function useCloudflareLogsPurge(options: UseCloudflareLogsOptions = {}) {
  const [logs, setLogs] = useState<CloudflarePurgeLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (options.search) params.append("search", options.search);
      if (options.cloudflare_account_id) params.append("cloudflare_account_id", options.cloudflare_account_id.toString());
      if (options.mode) params.append("mode", options.mode);
      if (options.status_filter) params.append("status_filter", options.status_filter);
      if (options.sort) params.append("sort", options.sort);
      if (options.order) params.append("order", options.order);
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.page) params.append("page", options.page.toString());

      const response = await fetch(`/api/admin/cloudflare/purge-logs?${params.toString()}`);
      const result: CloudflarePurgeLogsResponse = await response.json();

      if (result.status === "success") {
        setLogs(result.data || []);
        setPagination(result.pagination || pagination);
      } else {
        setError(result.error || "Failed to fetch purge logs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [
    options.search,
    options.cloudflare_account_id,
    options.mode,
    options.status_filter,
    options.sort,
    options.order,
    options.limit,
    options.page,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const refetch = fetchLogs;

  return {
    logs,
    pagination,
    isLoading,
    error,
    refetch,
  };
}

// Hook for purging cache
export interface PurgeRequest {
  cloudflare_account_id: number;
  zone_id: string;
  mode: "url" | "hostname" | "tag" | "prefix";
  payload: string[];
  exclusions?: string[];
}

interface PurgeResponse {
  status: "success" | "error";
  data?: {
    cloudflare_response: Record<string, unknown>;
    purge_id?: string;
    mode: string;
    payload: string[];
    exclusions?: string[];
  };
  error?: string;
  details?: Record<string, unknown> | string[];
  message?: string;
}

export function useCloudflareCache() {
  const [isPurging, setIsPurging] = useState(false);

  const purgeCache = async (request: PurgeRequest): Promise<PurgeResponse> => {
    try {
      setIsPurging(true);

      const response = await fetch("/api/admin/cloudflare/purge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const result: PurgeResponse = await response.json();
      return result;
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "An error occurred",
      };
    } finally {
      setIsPurging(false);
    }
  };

  return {
    purgeCache,
    isPurging,
  };
}