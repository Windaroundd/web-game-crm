"use client";

import { useState, useEffect, useCallback } from "react";

// Types
export interface CloudflareAccount {
  id: number;
  account_name: string;
  email: string;
  api_token: string; // Will be masked in responses
  account_id: string;
  created_at: string;
  created_by?: string;
}

export interface CloudflareAccountCreate {
  account_name: string;
  email: string;
  api_token: string;
  account_id: string;
}

export interface CloudflareAccountUpdate {
  account_name?: string;
  email?: string;
  api_token?: string;
  account_id?: string;
}

interface CloudflareAccountsResponse {
  status: "success" | "error";
  data?: CloudflareAccount[];
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

interface CloudflareAccountResponse {
  status: "success" | "error";
  data?: CloudflareAccount;
  error?: string;
  details?: Record<string, unknown> | string[];
  message?: string;
}

interface UseCloudflareAccountsOptions {
  search?: string;
  limit?: number;
  page?: number;
}

export function useCloudflareAccounts(options: UseCloudflareAccountsOptions = {}) {
  const [accounts, setAccounts] = useState<CloudflareAccount[]>([]);
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

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (options.search) params.append("search", options.search);
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.page) params.append("page", options.page.toString());

      const response = await fetch(`/api/admin/cloudflare/accounts?${params.toString()}`);
      const result: CloudflareAccountsResponse = await response.json();

      if (result.status === "success") {
        setAccounts(result.data || []);
        setPagination(result.pagination || pagination);
      } else {
        setError(result.error || "Failed to fetch cloudflare accounts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [
    options.search,
    options.limit,
    options.page,
  ]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (data: CloudflareAccountCreate): Promise<CloudflareAccountResponse> => {
    try {
      const response = await fetch("/api/admin/cloudflare/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: CloudflareAccountResponse = await response.json();

      if (result.status === "success") {
        await fetchAccounts(); // Refresh the list
      }

      return result;
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const updateAccount = async (id: number, data: CloudflareAccountUpdate): Promise<CloudflareAccountResponse> => {
    try {
      const response = await fetch(`/api/admin/cloudflare/accounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: CloudflareAccountResponse = await response.json();

      if (result.status === "success") {
        await fetchAccounts(); // Refresh the list
      }

      return result;
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const deleteAccount = async (id: number): Promise<CloudflareAccountResponse> => {
    try {
      const response = await fetch(`/api/admin/cloudflare/accounts/${id}`, {
        method: "DELETE",
      });

      const result: CloudflareAccountResponse = await response.json();

      if (result.status === "success") {
        await fetchAccounts(); // Refresh the list
      }

      return result;
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const refetch = fetchAccounts;

  return {
    accounts,
    pagination,
    isLoading,
    error,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}