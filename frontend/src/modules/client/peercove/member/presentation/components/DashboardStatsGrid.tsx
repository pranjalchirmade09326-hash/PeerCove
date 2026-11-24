/**
 * DashboardStatsGrid Component - Presentation Layer
 *
 * Grid layout for displaying dashboard statistics.
 *
 * Layer: Presentation
 */

"use client";

import React from "react";
import { DashboardStats } from "../domain/entities/DashboardStats";
import StatCard from "./StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Zap,
  BookOpen,
  Users,
} from "lucide-react";

interface DashboardStatsGridProps {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  stats,
  loading,
  error,
}) => {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Error loading statistics: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const completionRate = stats.getAppointmentCompletionRate();

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Check-ins This Week"
          value={stats.getCheckinsThisWeek()}
          unit=""
          icon={<Zap className="h-6 w-6" />}
          description="Weekly engagement activity"
        />
        <StatCard
          title="Active Goals"
          value={stats.getActiveGoals()}
          unit=""
          icon={<CheckCircle2 className="h-6 w-6" />}
          description="Current active goals"
        />
        <StatCard
          title="Saved Reflections"
          value={stats.getSavedReflections()}
          unit=""
          icon={<BookOpen className="h-6 w-6" />}
          description="Personal reflections saved"
        />
        <StatCard
          title="Support Requests"
          value={stats.getOpenSupportRequests()}
          unit=""
          icon={<Users className="h-6 w-6" />}
          description="Open peer support requests"
        />
      </div>

      {/* Appointment Stats */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Appointment Overview
        </h3>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Appointments"
            value={stats.getTotalAppointments()}
            icon={<Calendar className="h-6 w-6" />}
          />
          <StatCard
            title="Completed"
            value={stats.getCompletedAppointments()}
            icon={<CheckCircle2 className="h-6 w-6" />}
            trend="up"
            trendValue={completionRate}
          />
          <StatCard
            title="Pending"
            value={stats.getPendingAppointments()}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="Cancelled"
            value={stats.getCancelledAppointments()}
            icon={<MessageSquare className="h-6 w-6" />}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Completion Rate:{" "}
            <span className="font-semibold text-gray-900">{completionRate}%</span>
          </p>
        </div>
      </div>

      {/* Communication Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Open Conversations"
          value={stats.getOpenConversations()}
          description="Active message threads"
          icon={<MessageSquare className="h-6 w-6" />}
        />
        <StatCard
          title="Notifications"
          value={stats.getQueuedNotifications()}
          description="Pending notifications"
          icon={<Clock className="h-6 w-6" />}
        />
        <StatCard
          title="Privacy Requests"
          value={stats.getOpenPrivacyRequests()}
          description="Open data requests"
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      {/* Engagement Status */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          {stats.hasActiveEngagement()
            ? "✓ You have active engagement this week!"
            : "No active engagement this week. Start a check-in or reach out for support."}
        </p>
      </div>
    </div>
  );
};

export default DashboardStatsGrid;
