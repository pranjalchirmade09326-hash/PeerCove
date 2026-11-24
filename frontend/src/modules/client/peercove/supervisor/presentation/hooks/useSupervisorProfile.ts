/**
 * Hook: useSupervisorProfile
 * Custom React hook for fetching and managing supervisor profile
 * Presentation layer - React hook logic
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupervisorServiceImpl } from '../../infrastructure/services/SupervisorServiceImpl';
import { GetSupervisorProfileOutput } from '../../application/dto/index';

interface UseSupervisorProfileState {
  data: GetSupervisorProfileOutput | null;
  loading: boolean;
  error: string | null;
}

export function useSupervisorProfile(supervisorId: string) {
  const [state, setState] = useState<UseSupervisorProfileState>({
    data: null,
    loading: true,
    error: null,
  });

  const service = new SupervisorServiceImpl();

  const fetchProfile = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await service.getProfileUseCase().execute({ supervisorId });

      if (result.success && result.data) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result.error || 'Unknown error' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [supervisorId]);

  useEffect(() => {
    if (supervisorId) {
      fetchProfile();
    }
  }, [supervisorId, fetchProfile]);

  return {
    ...state,
    refetch: fetchProfile,
  };
}
