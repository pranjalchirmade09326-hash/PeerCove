/**
 * Presentation: AdminStatsGrid
 * Displays admin statistics in an 8-card grid layout
 * Color-coded cards with loading states and empty states
 * Presentation layer - React component
 */

'use client';

import React from 'react';
import { AdminStats } from '../../domain/entities/AdminStats';

interface AdminStatsGridProps {
  stats: AdminStats;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  icon?: string;
  loading?: boolean;
  testId?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  color,
  icon,
  loading = false,
  testId,
}) => {
  if (loading) {
    return (
      <div className={`stat-card stat-card-${color} skeleton`}>
        <div className="skeleton-line short" />
        <div className="skeleton-line long" />
      </div>
    );
  }

  return (
    <div 
      className={`stat-card stat-card-${color}`}
      data-testid={testId}
    >
      {icon && <span className="stat-icon">{icon}</span>}
      <h3 className="stat-label">{label}</h3>
      <div className="stat-value">
        <span className="value">{value}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>
    </div>
  );
};

const AdminStatsGrid: React.FC<AdminStatsGridProps> = ({ stats, loading = false }) => {
  const teamHealth = stats.teamHealth();
  const systemStatus = stats.getSystemStatus();
  const efficiencyRating = stats.efficiencyRating();
  const workloadScore = stats.workloadScore();

  const getHealthColor = (health: string): 'success' | 'warning' | 'error' => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'optimal':
        return 'success';
      case 'nominal':
        return 'warning';
      case 'degraded':
        return 'error';
      default:
        return 'info';
    }
  };

  const getWorkloadColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score < 20) return 'success';
    if (score < 50) return 'warning';
    return 'error';
  };

  const getEfficiencyColor = (rating: number): 'success' | 'warning' | 'error' => {
    if (rating >= 80) return 'success';
    if (rating >= 60) return 'warning';
    return 'error';
  };

  return (
    <div className="admin-stats-grid" data-testid="admin-stats-grid">
      <div className="stats-container">
        {/* Users Count */}
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          color="primary"
          icon="👥"
          loading={loading}
          testId="stat-total-users"
        />

        {/* Listeners Count */}
        <StatCard
          label="Total Listeners"
          value={stats.totalListeners}
          color="primary"
          icon="🎧"
          loading={loading}
          testId="stat-total-listeners"
        />

        {/* Reports Count */}
        <StatCard
          label="Total Reports"
          value={stats.totalReports}
          color="info"
          icon="📋"
          loading={loading}
          testId="stat-total-reports"
        />

        {/* Sessions Count */}
        <StatCard
          label="Total Sessions"
          value={stats.totalSessions}
          color="info"
          icon="📅"
          loading={loading}
          testId="stat-total-sessions"
        />

        {/* Active Moderation */}
        <StatCard
          label="Active Moderation"
          value={stats.activeModeration}
          color="warning"
          icon="🔍"
          loading={loading}
          testId="stat-active-moderation"
        />

        {/* Pending Reports */}
        <StatCard
          label="Pending Reports"
          value={stats.reportsPending}
          color={stats.reportsPending > 10 ? 'error' : 'warning'}
          icon="⏳"
          loading={loading}
          testId="stat-pending-reports"
        />

        {/* Average Response Time */}
        <StatCard
          label="Avg Response Time"
          value={stats.avgResponseTime}
          unit="min"
          color={stats.avgResponseTime > 300 ? 'error' : 'success'}
          icon="⏱️"
          loading={loading}
          testId="stat-avg-response-time"
        />

        {/* Team Health */}
        <StatCard
          label="Team Health"
          value={teamHealth.charAt(0).toUpperCase() + teamHealth.slice(1)}
          color={getHealthColor(teamHealth)}
          icon="❤️"
          loading={loading}
          testId={`stat-team-health-${teamHealth}`}
        />
      </div>

      {/* Metrics Section */}
      <div className="stats-metrics" data-testid="stats-metrics">
        <div className="metrics-card">
          <h3>Workload Score</h3>
          <div className="metric-display">
            <span className={`metric-value metric-${getWorkloadColor(workloadScore)}`}>
              {workloadScore}
            </span>
          </div>
        </div>

        <div className="metrics-card">
          <h3>Efficiency Rating</h3>
          <div className="metric-display">
            <span className={`metric-value metric-${getEfficiencyColor(efficiencyRating)}`}>
              {efficiencyRating}%
            </span>
          </div>
        </div>

        <div className="metrics-card">
          <h3>Report Resolution</h3>
          <div className="metric-display">
            <span className="metric-value metric-success">
              {stats.getReportResolutionRate()}%
            </span>
          </div>
        </div>

        <div className="metrics-card">
          <h3>System Status</h3>
          <div className="metric-display">
            <span className={`metric-value metric-${getStatusColor(systemStatus)}`}>
              {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsGrid;
