/**
 * useDashboardStats Hook - Presentation Layer
 *
 * React hook for fetching and managing dashboard statistics.
 *
 * Layer: Presentation
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardStats } from "../domain/entities/DashboardStats";
import { GetDashboardStatsUseCase } from "../application/usecases/GetDashboardStatsUseCase";
import { MemberServiceImpl } from "../infrastructure/services/MemberServiceImpl";

interface UseDashboardStatsState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

interface UseDashboardStatsResult extends UseDashboardStatsState {
  refetch: () => Promise<void>;
}

export function useDashboardStats(userId: string | null): UseDashboardStatsResult {
  const [state, setState] = useState<UseDashboardStatsState>({
    stats: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setState({
        stats: null,
        loading: false,
        error: "User ID is required",
      });
      return;
    }

    try {
      setState({ stats: null, loading: true, error: null });

      const service = new MemberServiceImpl();
      const useCase = new GetDashboardStatsUseCase(service);

      const result = await useCase.execute({ userId });

      if (result.success && result.data) {
        setState({
          stats: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          stats: null,
          loading: false,
          error: result.error || "Failed to fetch stats",
        });
      }
    } catch (error) {
      setState({
        stats: null,
        loading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refetch: fetchStats,
  };
}
