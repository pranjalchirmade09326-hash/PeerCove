/**
 * Presentation Component: AlertsTable
 * Displays alerts with severity color-coding
 * Presentation layer - pure UI component
 */

'use client';

import React, { useState } from 'react';
import { safetyConfig } from '../../config/safety.config';

interface Alert {
  id: string;
  profile_id: string;
  alert_type: 'warning' | 'urgent' | 'critical';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

interface AlertsTableProps {
  alerts: Alert[];
  loading?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onEscalate?: (alertId: string) => void;
}

export function AlertsTable({
  alerts,
  loading = false,
  onAcknowledge,
  onEscalate,
}: AlertsTableProps) {
  const getSeverityColor = (severity: string): string => {
    const severityColors: Record<string, string> = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#991B1B',
    };
    return severityColors[severity] || '#6B7280';
  };

  const getSeverityBgColor = (severity: string): string => {
    const bgColors: Record<string, string> = {
      low: 'bg-green-50',
      medium: 'bg-yellow-50',
      high: 'bg-red-50',
      critical: 'bg-red-100',
    };
    return bgColors[severity] || 'bg-gray-50';
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      warning: '⚠️',
      urgent: '🔴',
      critical: '🚨',
    };
    return icons[type] || '📌';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-center">Loading alerts...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Message</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Severity</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {alerts.map((alert) => (
            <tr key={alert.id} className={`${getSeverityBgColor(alert.severity)} hover:bg-gray-100 transition`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-lg">{getTypeIcon(alert.alert_type)}</span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-900">{alert.message}</p>
                <p className="text-xs text-gray-600 mt-1">ID: {alert.profile_id}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: getSeverityColor(alert.severity) }}
                >
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {alert.is_acknowledged ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-semibold">
                    Acknowledged
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded font-semibold">
                    New
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {formatDate(alert.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex gap-2">
                  {!alert.is_acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition font-semibold"
                    >
                      Acknowledge
                    </button>
                  )}
                  {onEscalate && alert.severity !== 'critical' && (
                    <button
                      onClick={() => onEscalate(alert.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition font-semibold"
                    >
                      Escalate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
