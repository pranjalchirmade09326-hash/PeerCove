/**
 * Presentation: AdminDashboard
 * Main orchestrator component for admin dashboard
 * Manages state and orchestrates sub-components
 * Presentation layer - React component
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminProfile } from '../../domain/entities/AdminProfile';
import { AdminStats } from '../../domain/entities/AdminStats';
import { useAdminProfile } from '../hooks/useAdminProfile';
import { useAdminStats } from '../hooks/useAdminStats';
import AdminProfileHeader from './AdminProfileHeader';
import AdminStatsGrid from './AdminStatsGrid';

interface AdminDashboardProps {
  adminId: string;
  refreshInterval?: number;
}

interface DashboardState {
  profile: AdminProfile | null;
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  lastRefreshTime: Date | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminId,
  refreshInterval = 30000,
}) => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    profile: null,
    stats: null,
    loading: true,
    error: null,
    lastRefreshTime: null,
  });

  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = 
    useAdminProfile(adminId);
  
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = 
    useAdminStats(adminId, refreshInterval);

  // Sync hook states to dashboard state
  useEffect(() => {
    setDashboardState((prev) => ({
      ...prev,
      profile: profile || prev.profile,
      stats: stats || prev.stats,
      loading: profileLoading || statsLoading,
      error: profileError || statsError,
      lastRefreshTime: profile || stats ? new Date() : prev.lastRefreshTime,
    }));
  }, [profile, stats, profileLoading, statsLoading, profileError, statsError]);

  const handleRefresh = useCallback(async () => {
    setDashboardState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      await Promise.all([refetchProfile(), refetchStats()]);
      setDashboardState((prev) => ({
        ...prev,
        error: null,
        lastRefreshTime: new Date(),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh dashboard';
      setDashboardState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    } finally {
      setDashboardState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, [refetchProfile, refetchStats]);

  if (dashboardState.loading && !dashboardState.profile) {
    return (
      <div className="admin-dashboard-loading" data-testid="admin-dashboard-loading">
        <div className="skeleton skeleton-header" />
        <div className="skeleton skeleton-grid" />
      </div>
    );
  }

  if (dashboardState.error && !dashboardState.profile) {
    return (
      <div 
        className="admin-dashboard-error" 
        data-testid="admin-dashboard-error"
        role="alert"
      >
        <div className="error-container">
          <h2>Failed to load admin dashboard</h2>
          <p>{dashboardState.error}</p>
          <button 
            onClick={handleRefresh}
            className="btn btn-primary"
            aria-label="Retry loading dashboard"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-dashboard-actions">
          <button 
            onClick={handleRefresh}
            disabled={dashboardState.loading}
            className="btn btn-secondary"
            aria-label="Refresh dashboard"
          >
            {dashboardState.loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {dashboardState.lastRefreshTime && (
            <span className="last-updated">
              Last updated: {dashboardState.lastRefreshTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {dashboardState.profile && (
        <AdminProfileHeader profile={dashboardState.profile} />
      )}

      {dashboardState.stats ? (
        <AdminStatsGrid 
          stats={dashboardState.stats}
          loading={dashboardState.loading}
        />
      ) : (
        <div className="stats-empty-state" data-testid="stats-empty-state">
          <p>No statistics available</p>
        </div>
      )}

      {dashboardState.error && dashboardState.profile && (
        <div className="admin-dashboard-warning" role="status">
          <p>Warning: {dashboardState.error}</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
