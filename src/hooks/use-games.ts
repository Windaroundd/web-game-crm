"use client";

import { useState, useCallback } from "react";
import { GameFormData } from "@/lib/utils/validations";

export interface Game {
  id: number;
  url: string;
  title: string;
  desc: string | null;
  category: string | null;
  game_url: string | null;
  game_icon: string | null;
  game_thumb: string | null;
  game_developer: string | null;
  game_publish_year: number | null;
  game_controls: Record<string, boolean>;
  game: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GamesResponse {
  status: string;
  data: Game[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UseGamesOptions {
  category?: string;
  isFeatured?: boolean | null;
  developer?: string;
  search?: string;
  year?: number;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  page?: number;
}

export function useGames(options: UseGamesOptions = {}) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchGames = useCallback(async (opts: UseGamesOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (opts.category) params.append("category", opts.category);
      if (opts.isFeatured !== undefined && opts.isFeatured !== null)
        params.append("isFeatured", opts.isFeatured.toString());
      if (opts.developer) params.append("developer", opts.developer);
      if (opts.search) params.append("search", opts.search);
      if (opts.year) params.append("year", opts.year.toString());
      if (opts.sort) params.append("sort", opts.sort);
      if (opts.order) params.append("order", opts.order);
      if (opts.limit) params.append("limit", opts.limit.toString());
      if (opts.page) params.append("page", opts.page.toString());

      const response = await fetch(`/api/admin/games?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch games");
      }

      const data: GamesResponse = await response.json();

      if (data.status === "success") {
        setGames(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error("API returned error status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGame = useCallback(
    async (gameData: GameFormData): Promise<Game | null> => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/games", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gameData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create game");
        }

        const data = await response.json();

        if (data.status === "success") {
          // Don't auto-refresh - let component handle this
          return data.data;
        } else {
          throw new Error(data.error || "Failed to create game");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateGame = useCallback(
    async (
      id: number,
      gameData: Partial<GameFormData>
    ): Promise<Game | null> => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/games/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gameData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update game");
        }

        const data = await response.json();

        if (data.status === "success") {
          // Don't auto-refresh - let component handle this
          return data.data;
        } else {
          throw new Error(data.error || "Failed to update game");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteGame = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/games/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete game");
      }

      const data = await response.json();

      if (data.status === "success") {
        // Don't auto-refresh - let component handle this
        return true;
      } else {
        throw new Error(data.error || "Failed to delete game");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // No automatic fetching - let the component control when to fetch

  return {
    games,
    loading,
    error,
    pagination,
    fetchGames,
    createGame,
    updateGame,
    deleteGame,
    refetch: () => fetchGames(options),
  };
}
