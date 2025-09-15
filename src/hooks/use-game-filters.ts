"use client";

import { useState, useEffect } from "react";

export interface GameFilters {
  categories: string[];
  developers: string[];
  years: number[];
}

export interface GameFiltersResponse {
  status: string;
  data: GameFilters;
}

export function useGameFilters() {
  const [filters, setFilters] = useState<GameFilters>({
    categories: [],
    developers: [],
    years: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/games/filters");

        if (!response.ok) {
          throw new Error("Failed to fetch filter options");
        }

        const data: GameFiltersResponse = await response.json();

        if (data.status === "success") {
          setFilters(data.data);
        } else {
          throw new Error("API returned error status");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        // Set default fallback values
        setFilters({
          categories: ["sports", "puzzle", "arcade", "strategy", "action", "adventure", "racing", "simulation", "rpg"],
          developers: [],
          years: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  return {
    filters,
    loading,
    error,
  };
}