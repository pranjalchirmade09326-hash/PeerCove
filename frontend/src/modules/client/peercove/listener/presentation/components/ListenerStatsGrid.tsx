/**
 * Component: ListenerStatsGrid
 * Displays listener statistics in a grid layout
 * Presentation layer - React component
 */

'use client';

import React from 'react';
import { GetListenerStatsOutput } from '../../application/dto/index';

interface ListenerStatsGridProps {
  stats: GetListenerStatsOutput | null;
  loading: boolean;
  error: string | null;
}

export function ListenerStatsGrid({
  stats,
  loading,
  error,
}: ListenerStatsGridProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error loading stats: {error}</p>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Clients',
      value: stats.totalClients,
      subtext: `${stats.activeClients} active`,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Completed Sessions',
      value: stats.completedSessions,
      subtext: `${stats.totalSessionHours.toFixed(1)}h total`,
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      subtext: `${stats.totalReviews} reviews`,
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'Response Time',
      value: `${stats.responseTimeMinutes}m`,
      subtext: 'Average',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Available Slots',
      value: stats.availableSlots,
      subtext: stats.availabilityStatus,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Client Retention',
      value: `${stats.clientRetention.toFixed(1)}%`,
      subtext: 'Rate',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Cancellation Rate',
      value: `${stats.cancellationRate.toFixed(1)}%`,
      subtext: 'Lower is better',
      color: 'bg-orange-50 text-orange-700',
    },
    {
      label: 'Performance Score',
      value: `${stats.performanceScore}/100`,
      subtext: 'Overall',
      color: 'bg-pink-50 text-pink-700',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg p-4 ${item.color}`}
          >
            <p className="text-sm font-medium opacity-75">{item.label}</p>
            <p className="mt-2 text-3xl font-bold">{item.value}</p>
            <p className="mt-1 text-xs opacity-60">{item.subtext}</p>
          </div>
        ))}
      </div>

      {/* Availability Status Section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Status Overview</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Availability</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              stats.availabilityStatus === 'available'
                ? 'bg-green-100 text-green-700'
                : stats.availabilityStatus === 'limited'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}>
              {stats.availabilityStatus}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Upcoming Appointments</span>
            <span className="font-semibold text-gray-900">{stats.upcomingAppointments}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Avg. Session Duration</span>
            <span className="font-semibold text-gray-900">
              {stats.averageSessionDuration.toFixed(2)}h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
