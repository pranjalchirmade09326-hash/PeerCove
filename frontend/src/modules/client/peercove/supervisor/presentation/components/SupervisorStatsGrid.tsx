/**
 * Component: SupervisorStatsGrid
 * Displays 8 stat cards with key performance metrics
 * Presentation layer - React component
 */

'use client';

import React from 'react';
import { GetSupervisorStatsOutput } from '../../application/dto/index';

interface SupervisorStatsGridProps {
  stats: GetSupervisorStatsOutput;
}

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  bgColor: string;
  icon: React.ReactNode;
  status?: 'excellent' | 'good' | 'fair' | 'poor' | 'high' | 'normal' | 'low';
}

function StatCard({ title, value, unit, trend, bgColor, icon, status }: StatCardProps) {
  const getStatusColor = () => {
    if (status === 'excellent' || status === 'high') return 'text-green-600';
    if (status === 'good' || status === 'normal') return 'text-blue-600';
    if (status === 'fair') return 'text-yellow-600';
    if (status === 'poor' || status === 'low') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`rounded-lg ${bgColor} p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${getStatusColor()}`}>{value}</p>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  );
}

export function SupervisorStatsGrid({ stats }: SupervisorStatsGridProps) {
  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Health Score</h3>
            <p className="text-sm text-gray-600">Combined metric of quality, productivity, and workload</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-5xl font-bold text-gray-900">{stats.healthScore.toFixed(1)}</p>
              <p className="text-sm text-gray-600">/100</p>
            </div>
            {stats.needsAttention && (
              <div className="rounded-lg bg-red-50 px-4 py-2">
                <p className="text-sm font-medium text-red-800">⚠️ Needs Attention</p>
              </div>
            )}
          </div>
        </div>
        {/* Health Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all ${stats.healthScore >= 80 ? 'bg-green-500' : stats.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${stats.healthScore}%` }}
          />
        </div>
      </div>

      {/* 8 Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Team Members */}
        <StatCard
          title="Team Members"
          value={stats.teamMembers}
          bgColor="bg-blue-50"
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Active Sessions */}
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          bgColor="bg-green-50"
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Quality Score */}
        <StatCard
          title="Quality Score"
          value={stats.avgQualityScore.toFixed(1)}
          unit="%"
          bgColor="bg-purple-50"
          status={stats.qualityStatus}
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Workload */}
        <StatCard
          title="Total Workload"
          value={stats.totalWorkload.toFixed(1)}
          unit={stats.workloadLevel}
          bgColor="bg-orange-50"
          status={stats.workloadLevel as any}
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        {/* Team Productivity */}
        <StatCard
          title="Team Productivity"
          value={stats.teamProductivity.toFixed(1)}
          unit="%"
          bgColor="bg-emerald-50"
          status={stats.productivityStatus}
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        {/* Session Utilization */}
        <StatCard
          title="Session Utilization"
          value={stats.sessionUtilization.toFixed(1)}
          unit="%"
          bgColor="bg-indigo-50"
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Avg Workload Per Member */}
        <StatCard
          title="Avg Workload/Member"
          value={stats.avgWorkloadPerMember.toFixed(1)}
          bgColor="bg-pink-50"
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8c0 1.657-.895 3-2 3s-2-1.343-2-3 .895-3 2-3 2 1.343 2 3zM12 14a4 4 0 00-8 0m8 0a4 4 0 018 0m-5.5 2a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          }
        />

        {/* Health Status */}
        <StatCard
          title="Health Status"
          value={stats.needsAttention ? '⚠️ Critical' : '✓ Healthy'}
          bgColor={stats.needsAttention ? 'bg-red-50' : 'bg-green-50'}
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
