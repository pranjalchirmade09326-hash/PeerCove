/**
 * MemberDashboard Component - Presentation Layer
 *
 * Main member dashboard layout that orchestrates all sub-components.
 * Handles data fetching and error states.
 *
 * Layer: Presentation
 */

"use client";

import React, { useEffect, useState } from "react";
import { useMemberProfile } from "../hooks/useMemberProfile";
import { useDashboardStats } from "../hooks/useDashboardStats";
import ProfileHeader from "./ProfileHeader";
import DashboardStatsGrid from "./DashboardStatsGrid";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface MemberDashboardProps {
  userId: string;
  onNavigate?: (path: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  userId,
  onNavigate,
}) => {
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useMemberProfile(userId);
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats(userId);
  const [retryCount, setRetryCount] = useState(0);

  const handleRefresh = async () => {
    setRetryCount((prev) => prev + 1);
    await Promise.all([refetchProfile(), refetchStats()]);
  };

  const hasError = profileError || statsError;
  const isLoading = profileLoading || statsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome Back!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Here's your wellness dashboard overview
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Profile Section */}
        <section className="mb-8">
          <ProfileHeader
            profile={profile || null}
            loading={profileLoading}
            error={profileError || null}
          />
        </section>

        {/* Error State */}
        {hasError && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">
                Unable to Load Full Dashboard
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                {profileError || statsError}
              </p>
              <p className="mt-2 text-xs text-amber-700">
                Retries: {retryCount}. This usually resolves automatically. Check your connection and try again.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Activity
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track your wellness journey and engagement
            </p>
          </div>
          <DashboardStatsGrid
            stats={stats || null}
            loading={statsLoading}
            error={statsError || null}
          />
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Quick Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button
              onClick={() => onNavigate?.("/peercove/member/intake")}
              variant="default"
              className="w-full"
            >
              Start Intake
            </Button>
            <Button
              onClick={() => onNavigate?.("/peercove/member/appointments")}
              variant="outline"
              className="w-full"
            >
              View Appointments
            </Button>
            <Button
              onClick={() => onNavigate?.("/peercove/member/wellness")}
              variant="outline"
              className="w-full"
            >
              Log Wellness
            </Button>
            <Button
              onClick={() => onNavigate?.("/peercove/member/support")}
              variant="outline"
              className="w-full"
            >
              Get Support
            </Button>
          </div>
        </section>

        {/* Footer Info */}
        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
