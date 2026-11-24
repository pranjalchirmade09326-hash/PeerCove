/**
 * Presentation Hook: useSafetyStats
 * Custom hook for managing safety statistics state and operations
 * Presentation layer - handles component state and side effects
 */

import { useState, useEffect, useCallback } from 'react';
import { GetSafetyStatsUseCase } from '../../application/usecases/GetSafetyStatsUseCase';
import { GetSafetyStatsOutput, Result } from '../../application/dto/index';
import { SafetyServiceImpl } from '../../infrastructure/services/SafetyServiceImpl';
import { SafetyRepository } from '../../infrastructure/repositories/SafetyRepository';

interface UseSafetyStatsState {
  stats: GetSafetyStatsOutput | null;
  loading: boolean;
  error: string | null;
}

export function useSafetyStats(safetyId: string | null) {
  const [state, setState] = useState<UseSafetyStatsState>({
    stats: null,
    loading: false,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    if (!safetyId) {
      setState({ stats: null, loading: false, error: null });
      return;
    }

    setState({ stats: null, loading: true, error: null });

    try {
      const repository = new SafetyRepository();
      const service = new SafetyServiceImpl(repository);
      const useCase = new GetSafetyStatsUseCase(service);

      const result = await useCase.execute({ safetyId });

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
          error: result.error || 'Failed to fetch stats',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState({
        stats: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [safetyId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}
