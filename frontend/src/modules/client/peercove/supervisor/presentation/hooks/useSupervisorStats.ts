/**
 * Hook: useSupervisorStats
 * Custom React hook for fetching and managing supervisor statistics
 * Presentation layer - React hook logic
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupervisorServiceImpl } from '../../infrastructure/services/SupervisorServiceImpl';
import { GetSupervisorStatsOutput } from '../../application/dto/index';

interface UseSupervisorStatsState {
  data: GetSupervisorStatsOutput | null;
  loading: boolean;
  error: string | null;
}

export function useSupervisorStats(supervisorId: string) {
  const [state, setState] = useState<UseSupervisorStatsState>({
    data: null,
    loading: true,
    error: null,
  });

  const service = new SupervisorServiceImpl();

  const fetchStats = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await service.getStatsUseCase().execute({ supervisorId });

      if (result.success && result.data) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result.error || 'Unknown error' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [supervisorId]);

  useEffect(() => {
    if (supervisorId) {
      fetchStats();
    }
  }, [supervisorId, fetchStats]);

  return {
    ...state,
    refetch: fetchStats,
  };
}
