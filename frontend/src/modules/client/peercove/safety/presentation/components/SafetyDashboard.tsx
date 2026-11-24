/**
 * Presentation Component: SafetyDashboard
 * Main orchestrator component for safety module
 * Presentation layer - coordinates sub-components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SafetyProfileHeader } from './SafetyProfileHeader';
import { SafetyStatsGrid } from './SafetyStatsGrid';
import { AlertsTable } from './AlertsTable';
import { useSafetyProfile } from '../hooks/useSafetyProfile';
import { useSafetyStats } from '../hooks/useSafetyStats';
import { SafetyRepository } from '../../infrastructure/repositories/SafetyRepository';
import { SafetyServiceImpl } from '../../infrastructure/services/SafetyServiceImpl';

interface SafetyDashboardProps {
  profileId: string;
  onError?: (error: string) => void;
  autoRefreshInterval?: number;
}

export function SafetyDashboard({
  profileId,
  onError,
  autoRefreshInterval = 30000,
}: SafetyDashboardProps) {
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useSafetyProfile(profileId);
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useSafetyStats(profileId);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [refreshTime, setRefreshTime] = useState<Date>(new Date());

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      try {
        const repository = new SafetyRepository();
        const service = new SafetyServiceImpl(repository);
        const fetchedAlerts = await service.getActiveAlerts(50);
        setAlerts(fetchedAlerts as any[]);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetchProfile();
      refetchStats();
      setRefreshTime(new Date());
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refetchProfile, refetchStats]);

  // Handle errors
  useEffect(() => {
    if (profileError && onError) {
      onError(profileError);
    }
    if (statsError && onError) {
      onError(statsError);
    }
  }, [profileError, statsError, onError]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const repository = new SafetyRepository();
      const service = new SafetyServiceImpl(repository);
      await service.acknowledgeAlert(alertId);
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_acknowledged: true } : a));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleEscalateAlert = async (alertId: string) => {
    try {
      const repository = new SafetyRepository();
      const service = new SafetyServiceImpl(repository);
      await service.escalateAlert(alertId);
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, severity: 'critical' } : a));
    } catch (err) {
      console.error('Failed to escalate alert:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Safety Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Last updated: {refreshTime.toLocaleTimeString()}
          </p>
        </div>

        {/* Loading State */}
        {profileLoading || statsLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">Loading safety information...</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            {profile ? (
              <SafetyProfileHeader
                firstName={profile.first_name}
                lastName={profile.last_name}
                email={profile.email}
                phone={profile.phone}
                riskScore={profile.risk_score}
                status={profile.status}
                needsIntervention={profile.needs_intervention}
                isActive={profile.is_active}
              />
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">Failed to load profile: {profileError}</p>
              </div>
            )}

            {/* Stats Grid */}
            {stats ? (
              <SafetyStatsGrid
                highRiskUsers={stats.high_risk_users}
                alertsActive={stats.alerts_active}
                incidentsReported={stats.incidents_reported}
                avgResponseTimeMinutes={stats.avg_response_time_minutes}
                escalationsMade={stats.escalations_made}
                assessmentCompletionRate={stats.assessment_completion_rate}
                criticalCases={stats.critical_cases}
                healthScore={stats.health_score}
                systemStatus={stats.system_status}
              />
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">Failed to load statistics: {statsError}</p>
              </div>
            )}

            {/* Alerts Table */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Alerts</h2>
              <AlertsTable
                alerts={alerts}
                loading={alertsLoading}
                onAcknowledge={handleAcknowledgeAlert}
                onEscalate={handleEscalateAlert}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  refetchProfile();
                  refetchStats();
                  setRefreshTime(new Date());
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Refresh Now
              </button>
              <button
                className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Export Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
