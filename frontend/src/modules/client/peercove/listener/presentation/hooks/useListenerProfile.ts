/**
 * Custom Hook: useListenerProfile
 * Manages listener profile data fetching and state
 * Presentation layer - React hook for data management
 */

import { useEffect, useState, useCallback } from 'react';
import { ListenerProfile } from '../../domain/entities/ListenerProfile';
import { ListenerRepository } from '../../infrastructure/repositories/ListenerRepository';
import { ListenerServiceImpl } from '../../infrastructure/services/ListenerServiceImpl';
import { GetListenerProfileUseCase } from '../../application/usecases/GetListenerProfileUseCase';

interface UseListenerProfileState {
  profile: ListenerProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useListenerProfile(listenerId: string): UseListenerProfileState {
  const [profile, setProfile] = useState<ListenerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
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
      const useCase = new GetListenerProfileUseCase(service);

      const result = await useCase.execute({ listenerId });

      if (result.success && result.data) {
        setProfile(
          new ListenerProfile({
            id: result.data.id,
            userId: result.data.userId,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            email: result.data.email,
            phoneNumber: result.data.phoneNumber,
            specializations: result.data.specializations,
            licenseNumber: result.data.licenseNumber,
            yearsOfExperience: result.data.yearsOfExperience,
            bio: result.data.bio,
            profileImageUrl: result.data.profileImageUrl,
            isActive: result.data.isActive,
            verificationStatus: result.data.verificationStatus,
            createdAt: new Date(result.data.createdAt),
            updatedAt: new Date(result.data.updatedAt),
          })
        );
      } else {
        setError(result.error || 'Failed to fetch listener profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('useListenerProfile error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [listenerId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}
