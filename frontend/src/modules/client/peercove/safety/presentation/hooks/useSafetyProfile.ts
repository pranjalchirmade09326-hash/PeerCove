/**
 * Presentation Hook: useSafetyProfile
 * Custom hook for managing safety profile state and operations
 * Presentation layer - handles component state and side effects
 */

import { useState, useEffect, useCallback } from 'react';
import { GetSafetyProfileUseCase } from '../../application/usecases/GetSafetyProfileUseCase';
import { GetSafetyProfileOutput, Result } from '../../application/dto/index';
import { SafetyServiceImpl } from '../../infrastructure/services/SafetyServiceImpl';
import { SafetyRepository } from '../../infrastructure/repositories/SafetyRepository';

interface UseSafetyProfileState {
  profile: GetSafetyProfileOutput | null;
  loading: boolean;
  error: string | null;
}

export function useSafetyProfile(profileId: string | null) {
  const [state, setState] = useState<UseSafetyProfileState>({
    profile: null,
    loading: false,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    if (!profileId) {
      setState({ profile: null, loading: false, error: null });
      return;
    }

    setState({ profile: null, loading: true, error: null });

    try {
      const repository = new SafetyRepository();
      const service = new SafetyServiceImpl(repository);
      const useCase = new GetSafetyProfileUseCase(service);

      const result = await useCase.execute({ profileId });

      if (result.success && result.data) {
        setState({
          profile: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          profile: null,
          loading: false,
          error: result.error || 'Failed to fetch profile',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState({
        profile: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refetch = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}
