/**
 * Custom Hook: useListenerStats
 * Manages listener statistics data fetching
 * Presentation layer - React hook for data management
 */

import { useEffect, useState, useCallback } from 'react';
import { ListenerStats } from '../../domain/entities/ListenerStats';
import { ListenerRepository } from '../../infrastructure/repositories/ListenerRepository';
import { ListenerServiceImpl } from '../../infrastructure/services/ListenerServiceImpl';
import { GetListenerStatsUseCase } from '../../application/usecases/GetListenerStatsUseCase';
import { GetListenerStatsOutput } from '../../application/dto/index';

interface UseListenerStatsState {
  stats: GetListenerStatsOutput | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useListenerStats(listenerId: string): UseListenerStatsState {
  const [stats, setStats] = useState<GetListenerStatsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!listenerId) {
      setError('Listener ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const repository = new ListenerRepository();
      const service = new ListenerServiceImpl(repository);
      const useCase = new GetListenerStatsUseCase(service);

      const result = await useCase.execute({ listenerId });

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch listener statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('useListenerStats error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [listenerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
