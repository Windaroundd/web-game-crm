"use client";

import { useState, useCallback } from "react";
import { validatePurgePayload } from "@/lib/cloudflare/api";

// Types for purge operations
export interface PurgeRequest {
  cloudflare_account_id: number;
  zone_id: string;
  mode: "url" | "hostname" | "tag" | "prefix";
  payload: string[];
  exclusions?: string[];
}

export interface PurgeResponse {
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

interface UseCloudflarePurgeReturn {
  isPurging: boolean;
  purgeError: string | null;
  lastPurgeResult: PurgeResponse | null;
  purgeCache: (request: PurgeRequest) => Promise<PurgeResponse>;
  validatePayload: (mode: string, payload: string[]) => { valid: boolean; errors: string[] };
  clearError: () => void;
  clearResult: () => void;
}

export function useCloudflarePurge(): UseCloudflarePurgeReturn {
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [lastPurgeResult, setLastPurgeResult] = useState<PurgeResponse | null>(null);

  const purgeCache = useCallback(async (request: PurgeRequest): Promise<PurgeResponse> => {
    try {
      setIsPurging(true);
      setPurgeError(null);
      setLastPurgeResult(null);

      // Client-side validation
      const validation = validatePurgePayload(request.mode, request.payload);
      if (!validation.valid) {
        const error = `Invalid payload: ${validation.errors.join(", ")}`;
        setPurgeError(error);
        const errorResponse: PurgeResponse = {
          status: "error",
          error,
          details: validation.errors,
        };
        setLastPurgeResult(errorResponse);
        return errorResponse;
      }

      const response = await fetch("/api/admin/cloudflare/purge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const result: PurgeResponse = await response.json();

      if (result.status === "success") {
        setLastPurgeResult(result);
        setPurgeError(null);
      } else {
        setPurgeError(result.error || "Purge operation failed");
        setLastPurgeResult(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setPurgeError(errorMessage);

      const errorResponse: PurgeResponse = {
        status: "error",
        error: errorMessage,
      };
      setLastPurgeResult(errorResponse);

      return errorResponse;
    } finally {
      setIsPurging(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setPurgeError(null);
  }, []);

  const clearResult = useCallback(() => {
    setLastPurgeResult(null);
    setPurgeError(null);
  }, []);

  return {
    isPurging,
    purgeError,
    lastPurgeResult,
    purgeCache,
    validatePayload: validatePurgePayload,
    clearError,
    clearResult,
  };
}