/**
 * Presentation Component: SafetyStatsGrid
 * Displays 8 stat cards with color-coded alerts
 * Presentation layer - pure UI component
 */

'use client';

import React from 'react';
import { safetyConfig } from '../../config/safety.config';

interface SafetyStatsGridProps {
  highRiskUsers: number;
  alertsActive: number;
  incidentsReported: number;
  avgResponseTimeMinutes: number;
  escalationsMade: number;
  assessmentCompletionRate: number;
  criticalCases: number;
  healthScore: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
}

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

function StatCard({ title, value, unit, icon, color, trend, severity }: StatCardProps) {
  const bgColor = {
    low: 'bg-green-50',
    medium: 'bg-yellow-50',
    high: 'bg-orange-50',
    critical: 'bg-red-50',
  }[severity || 'low'];

  return (
    <div className={`${bgColor} rounded-lg p-4 border-l-4`} style={{ borderColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-semibold">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-2xl font-bold" style={{ color }}>
              {value}
            </p>
            {unit && <p className="text-gray-600 text-sm">{unit}</p>}
          </div>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
      {trend && (
        <div className="mt-2 text-xs">
          {trend === 'up' && <span style={{ color }}>↑ Rising</span>}
          {trend === 'down' && <span style={{ color }}>↓ Declining</span>}
          {trend === 'stable' && <span className="text-gray-600">→ Stable</span>}
        </div>
      )}
    </div>
  );
}

export function SafetyStatsGrid({
  highRiskUsers,
  alertsActive,
  incidentsReported,
  avgResponseTimeMinutes,
  escalationsMade,
  assessmentCompletionRate,
  criticalCases,
  healthScore,
  systemStatus,
}: SafetyStatsGridProps) {
  const statusColor = {
    healthy: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
  }[systemStatus];

  const responseTimeSeverity =
    avgResponseTimeMinutes <= 15
      ? 'low'
      : avgResponseTimeMinutes <= 60
        ? 'medium'
        : avgResponseTimeMinutes <= 120
          ? 'high'
          : 'critical';

  const alertsSeverity =
    alertsActive === 0 ? 'low' : alertsActive <= 5 ? 'medium' : alertsActive <= 15 ? 'high' : 'critical';

  const criticalSeverity = criticalCases === 0 ? 'low' : criticalCases <= 2 ? 'medium' : criticalCases <= 5 ? 'high' : 'critical';

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">System Health Overview</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-semibold">Overall Health Score</p>
            <p className="text-4xl font-bold mt-2" style={{ color: statusColor }}>
              {healthScore}%
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Status: <span style={{ color: statusColor }}>{systemStatus.toUpperCase()}</span>
            </p>
          </div>
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: statusColor + '20', border: `3px solid ${statusColor}` }}>
            <span className="text-2xl font-bold" style={{ color: statusColor }}>
              {healthScore}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="High Risk Users"
          value={highRiskUsers}
          icon="⚠️"
          color="#EF4444"
          severity={highRiskUsers === 0 ? 'low' : highRiskUsers <= 5 ? 'medium' : highRiskUsers <= 15 ? 'high' : 'critical'}
        />

        <StatCard
          title="Active Alerts"
          value={alertsActive}
          icon="🔔"
          color="#F59E0B"
          severity={alertsSeverity}
          trend="stable"
        />

        <StatCard
          title="Incidents Reported"
          value={incidentsReported}
          icon="📋"
          color="#6366F1"
          severity={incidentsReported === 0 ? 'low' : incidentsReported <= 5 ? 'medium' : 'high'}
        />

        <StatCard
          title="Avg Response Time"
          value={Math.round(avgResponseTimeMinutes)}
          unit="min"
          icon="⏱️"
          color={responseTimeSeverity === 'low' ? '#10B981' : responseTimeSeverity === 'medium' ? '#F59E0B' : '#EF4444'}
          severity={responseTimeSeverity}
        />

        <StatCard
          title="Escalations Made"
          value={escalationsMade}
          icon="📈"
          color="#8B5CF6"
          severity={escalationsMade === 0 ? 'low' : escalationsMade <= 3 ? 'medium' : escalationsMade <= 8 ? 'high' : 'critical'}
        />

        <StatCard
          title="Assessment Completion"
          value={Math.round(assessmentCompletionRate)}
          unit="%"
          icon="✅"
          color={assessmentCompletionRate >= 80 ? '#10B981' : assessmentCompletionRate >= 50 ? '#F59E0B' : '#EF4444'}
          severity={assessmentCompletionRate >= 80 ? 'low' : assessmentCompletionRate >= 50 ? 'medium' : 'high'}
        />

        <StatCard
          title="Critical Cases"
          value={criticalCases}
          icon="🚨"
          color="#991B1B"
          severity={criticalSeverity}
        />

        <StatCard
          title="Total Urgent Cases"
          value={highRiskUsers + criticalCases}
          icon="🎯"
          color={highRiskUsers + criticalCases === 0 ? '#10B981' : highRiskUsers + criticalCases <= 5 ? '#F59E0B' : '#EF4444'}
          severity={highRiskUsers + criticalCases === 0 ? 'low' : highRiskUsers + criticalCases <= 5 ? 'medium' : 'high'}
        />
      </div>
    </div>
  );
}
