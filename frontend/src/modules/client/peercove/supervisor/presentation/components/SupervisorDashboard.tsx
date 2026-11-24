/**
 * Component: SupervisorDashboard
 * Main orchestrator component for supervisor profile and stats
 * Presentation layer - React component
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useSupervisorProfile } from '../hooks/useSupervisorProfile';
import { useSupervisorStats } from '../hooks/useSupervisorStats';
import { SupervisorProfileHeader } from './SupervisorProfileHeader';
import { SupervisorStatsGrid } from './SupervisorStatsGrid';
import { TeamMembersTable } from './TeamMembersTable';

interface SupervisorDashboardProps {
  supervisorId: string;
  onRefresh?: () => void;
}

export function SupervisorDashboard({
  supervisorId,
  onRefresh,
}: SupervisorDashboardProps) {
  const profileState = useSupervisorProfile(supervisorId);
  const statsState = useSupervisorStats(supervisorId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Concurrent fetching for better performance
      await Promise.all([
        profileState.refetch(),
        statsState.refetch(),
      ]);
      onRefresh?.();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [profileState, statsState, onRefresh]);

  const hasError = profileState.error || statsState.error;
  const isLoading = profileState.loading || statsState.loading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="mt-2 text-gray-600">View supervisor profile and team performance metrics</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Refreshing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <div className="mt-2 text-sm text-red-700">
                {profileState.error || statsState.error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      {!isLoading && profileState.data && (
        <SupervisorProfileHeader profile={profileState.data} />
      )}

      {/* Stats Grid */}
      {!isLoading && statsState.data && (
        <SupervisorStatsGrid stats={statsState.data} />
      )}

      {/* Team Members Table */}
      {!isLoading && profileState.data && (
        <TeamMembersTable supervisorId={supervisorId} />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
