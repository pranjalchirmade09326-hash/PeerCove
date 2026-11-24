/**
 * Custom Hook: useAdminProfile
 * Manages admin profile data fetching and state
 * Presentation layer - React hook for data management
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminProfile } from '../../domain/entities/AdminProfile';
import { AdminRepository } from '../../infrastructure/repositories/AdminRepository';
import { AdminServiceImpl } from '../../infrastructure/services/AdminServiceImpl';
import { GetAdminProfileUseCase } from '../../application/usecases/GetAdminProfileUseCase';

interface UseAdminProfileState {
  profile: AdminProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminProfile(adminId: string): UseAdminProfileState {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize service instances
  const service = useMemo(() => {
    const repository = new AdminRepository();
    return new AdminServiceImpl(repository);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!adminId) {
      setError('Admin ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const useCase = new GetAdminProfileUseCase(service);
      const result = await useCase.execute({ adminId });

      if (result.success && result.data) {
        setProfile(
          new AdminProfile({
            id: result.data.id,
            userId: result.data.userId,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            email: result.data.email,
            role: result.data.role,
            permissions: result.data.permissions,
            departmentId: result.data.departmentId,
            accessLevel: result.data.accessLevel,
            isActive: result.data.isActive,
            createdAt: new Date(result.data.createdAt),
            updatedAt: new Date(result.data.updatedAt),
          })
        );
      } else {
        setError(result.error || 'Failed to fetch admin profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('useAdminProfile error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [adminId, service]);

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
