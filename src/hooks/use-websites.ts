import { useState, useEffect } from "react";
import type { Database } from "@/lib/types/database";

type WebsiteRow = Database["public"]["Tables"]["websites"]["Row"];

export interface WebsitesResponse {
  status: "success" | "error";
  data: WebsiteRow[];
  error?: string;
  details?: unknown;
}

export function useWebsites() {
  const [websites, setWebsites] = useState<WebsiteRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/admin/websites?limit=100");
        const result: WebsitesResponse = await response.json();

        if (result.status === "success") {
          setWebsites(result.data);
        } else {
          setError(result.error || "Failed to fetch websites");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsites();
  }, []);

  return {
    websites,
    isLoading,
    error,
  };
}