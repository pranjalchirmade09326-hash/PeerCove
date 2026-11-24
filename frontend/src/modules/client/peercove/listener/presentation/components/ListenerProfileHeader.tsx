/**
 * Component: ListenerProfileHeader
 * Displays listener profile information with verification badge
 * Presentation layer - React component
 */

'use client';

import React from 'react';
import { ListenerProfile } from '../../domain/entities/ListenerProfile';

interface ListenerProfileHeaderProps {
  profile: ListenerProfile | null;
  loading: boolean;
  error: string | null;
}

export function ListenerProfileHeader({
  profile,
  loading,
  error,
}: ListenerProfileHeaderProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 w-16 rounded-full bg-gray-200" />
        <div className="h-6 w-32 bg-gray-200" />
        <div className="h-4 w-48 bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.fullName}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <span className="text-xl font-semibold text-blue-700">{profile.getInitials()}</span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
            {profile.isVerified() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-sm font-medium text-green-700">Verified</span>
              </span>
            )}
          </div>

          <p className="mt-1 text-gray-600">{profile.email}</p>

          {profile.phoneNumber && (
            <p className="text-gray-600">{profile.phoneNumber}</p>
          )}

          {profile.bio && (
            <p className="mt-4 text-gray-700">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Specializations */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900">Specializations</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.specializations.map((spec) => (
            <span
              key={spec}
              className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="border-t pt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Experience</p>
          <p className="text-lg font-semibold text-gray-900">{profile.yearsOfExperience} years</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <p className={`text-lg font-semibold ${profile.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {profile.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Verification</p>
          <p className="text-lg font-semibold capitalize text-gray-900">
            {profile.verificationStatus}
          </p>
        </div>
      </div>
    </div>
  );
}
