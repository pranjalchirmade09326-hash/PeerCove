/**
 * ProfileHeader Component - Presentation Layer
 *
 * Displays member profile information in header.
 *
 * Layer: Presentation
 */

"use client";

import React from "react";
import { MemberProfile } from "../domain/entities/MemberProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  profile: MemberProfile | null;
  loading: boolean;
  error: string | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  loading,
  error,
}) => {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">
          Error loading profile: {error}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {profile.getAvatar() && (
            <img
              src={profile.getAvatar()}
              alt={profile.getDisplayName()}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.getDisplayName()}
            </h1>
            <p className="text-sm text-gray-600">{profile.getEmail()}</p>
            {profile.getOrganization() && (
              <p className="mt-1 text-sm text-gray-500">
                {profile.getOrganization()}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Member since {profile.getJoinedDate().toLocaleDateString()}</p>
          <p>Last active {profile.getLastActive().toLocaleDateString()}</p>
        </div>
      </div>

      {profile.getBio() && (
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
          {profile.getBio()}
        </p>
      )}
    </div>
  );
};

export default ProfileHeader;
