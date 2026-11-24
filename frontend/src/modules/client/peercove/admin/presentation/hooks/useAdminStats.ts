/**
 * Custom Hook: useAdminStats
 * Manages admin statistics data fetching with auto-refresh
 * Presentation layer - React hook for stats management
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { AdminStats } from '../../domain/entities/AdminStats';
import { AdminRepository } from '../../infrastructure/repositories/AdminRepository';
import { AdminServiceImpl } from '../../infrastructure/services/AdminServiceImpl';
import { GetAdminStatsUseCase } from '../../application/usecases/GetAdminStatsUseCase';

interface UseAdminStatsState {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isAutoRefreshing: boolean;
}

export function useAdminStats(
  adminId: string,
  autoRefreshInterval: number = 30000
): UseAdminStatsState {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize service instances
  const service = useMemo(() => {
    const repository = new AdminRepository();
    return new AdminServiceImpl(repository);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!adminId) {
      setError('Admin ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const useCase = new GetAdminStatsUseCase(service);
      const result = await useCase.execute({ adminId });

      if (result.success && result.data) {
        setStats(
          new AdminStats({
            adminId: result.data.adminId,
            totalUsers: result.data.totalUsers,
            totalListeners: result.data.totalListeners,
            totalReports: result.data.totalReports,
            totalSessions: result.data.totalSessions,
            activeModeration: result.data.activeModeration,
            reportsPending: result.data.reportsPending,
            avgResponseTime: result.data.avgResponseTime,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      } else {
        setError(result.error || 'Failed to fetch admin stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('useAdminStats error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [adminId, service]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      setIsAutoRefreshing(true);
      refreshIntervalRef.current = setInterval(async () => {
        try {
          const useCase = new GetAdminStatsUseCase(service);
          const result = await useCase.execute({ adminId });

          if (result.success && result.data) {
            setStats(
              new AdminStats({
                adminId: result.data.adminId,
                totalUsers: result.data.totalUsers,
                totalListeners: result.data.totalListeners,
                totalReports: result.data.totalReports,
                totalSessions: result.data.totalSessions,
                activeModeration: result.data.activeModeration,
                reportsPending: result.data.reportsPending,
                avgResponseTime: result.data.avgResponseTime,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            );
          }
        } catch (err) {
          console.error('Auto-refresh error:', err);
        }
      }, autoRefreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        setIsAutoRefreshing(false);
      }
    };
  }, [adminId, autoRefreshInterval, service]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    isAutoRefreshing,
  };
}
