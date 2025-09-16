import { useState, useEffect, useCallback } from "react";
import type { Database } from "@/lib/types/database";

type TextlinkRow = Database["public"]["Tables"]["textlinks"]["Row"];
type TextlinkInsert = Database["public"]["Tables"]["textlinks"]["Insert"];
type TextlinkUpdate = Database["public"]["Tables"]["textlinks"]["Update"];

export interface TextlinkWithWebsite extends TextlinkRow {
  websites?: {
    id: number;
    url: string;
    title: string;
  } | null;
}

export interface TextlinkFilters {
  search?: string;
  website_id?: number;
  custom_domain?: string;
  show_on_all_pages?: boolean;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  page?: number;
}

export interface TextlinksPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TextlinksResponse {
  status: "success" | "error";
  data: TextlinkWithWebsite[];
  pagination: TextlinksPagination;
  error?: string;
  details?: unknown;
}

export interface TextlinkResponse {
  status: "success" | "error";
  data?: TextlinkWithWebsite;
  message?: string;
  error?: string;
  details?: unknown;
}

export function useTextlinks(filters: TextlinkFilters = {}) {
  const [textlinks, setTextlinks] = useState<TextlinkWithWebsite[]>([]);
  const [pagination, setPagination] = useState<TextlinksPagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTextlinks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.search) params.append("search", filters.search);
      if (filters.website_id) params.append("website_id", filters.website_id.toString());
      if (filters.custom_domain) params.append("custom_domain", filters.custom_domain);
      if (filters.show_on_all_pages !== undefined) {
        params.append("show_on_all_pages", filters.show_on_all_pages.toString());
      }
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.order) params.append("order", filters.order);
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.page) params.append("page", filters.page.toString());

      const response = await fetch(`/api/admin/textlinks?${params.toString()}`);
      const result: TextlinksResponse = await response.json();

      if (result.status === "success") {
        setTextlinks(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error || "Failed to fetch textlinks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.search,
    filters.website_id,
    filters.custom_domain,
    filters.show_on_all_pages,
    filters.sort,
    filters.order,
    filters.limit,
    filters.page,
  ]);

  useEffect(() => {
    fetchTextlinks();
  }, [fetchTextlinks]);

  const createTextlink = async (data: TextlinkInsert): Promise<TextlinkResponse> => {
    try {
      const response = await fetch("/api/admin/textlinks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: TextlinkResponse = await response.json();

      if (result.status === "success") {
        await fetchTextlinks(); // Refresh the list
      }

      return result;
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const updateTextlink = async (id: number, data: TextlinkUpdate): Promise<TextlinkResponse> => {
    try {
      const response = await fetch(`/api/admin/textlinks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: TextlinkResponse = await response.json();

      if (result.status === "success") {
        await fetchTextlinks(); // Refresh the list
      }

      return result;
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const deleteTextlink = async (id: number): Promise<TextlinkResponse> => {
    try {
      const response = await fetch(`/api/admin/textlinks/${id}`, {
        method: "DELETE",
      });

      const result: TextlinkResponse = await response.json();

      if (result.status === "success") {
        await fetchTextlinks(); // Refresh the list
      }

      return result;
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  return {
    textlinks,
    pagination,
    isLoading,
    error,
    refetch: fetchTextlinks,
    createTextlink,
    updateTextlink,
    deleteTextlink,
  };
}