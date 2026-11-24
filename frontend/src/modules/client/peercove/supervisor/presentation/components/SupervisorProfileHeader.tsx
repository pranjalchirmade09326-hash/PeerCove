/**
 * Component: SupervisorProfileHeader
 * Displays supervisor profile information with avatar and status badge
 * Presentation layer - React component
 */

'use client';

import React from 'react';
import { GetSupervisorProfileOutput } from '../../application/dto/index';

interface SupervisorProfileHeaderProps {
  profile: GetSupervisorProfileOutput;
}

export function SupervisorProfileHeader({ profile }: SupervisorProfileHeaderProps) {
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-50';
    if (rating >= 4.0) return 'text-blue-600 bg-blue-50';
    if (rating >= 3.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'lead':
        return 'bg-purple-100 text-purple-800';
      case 'senior':
        return 'bg-blue-100 text-blue-800';
      case 'mid':
        return 'bg-green-100 text-green-800';
      case 'junior':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8">
      <div className="flex items-start justify-between">
        {/* Profile Info */}
        <div className="flex gap-6">
          {/* Avatar */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{profile.fullName}</h2>
              <p className="text-lg text-gray-600">{profile.department}</p>
            </div>

            <div className="flex gap-3">
              <span className={`inline-block rounded-full px-4 py-1 text-sm font-medium ${getExperienceBadgeColor(profile.experienceLevel)}`}>
                {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)}
              </span>
              {profile.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Active
                </span>
              )}
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              {profile.phone && (
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rating Card */}
        <div className={`rounded-lg p-6 ${getRatingColor(profile.performanceRating)}`}>
          <div className="text-center">
            <p className="text-sm font-medium opacity-75">Performance Rating</p>
            <p className="mt-2 text-4xl font-bold">{profile.performanceRating.toFixed(1)}</p>
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(profile.performanceRating) ? 'fill-current' : 'text-gray-300 fill-current opacity-30'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-8 grid grid-cols-4 gap-6 border-t border-gray-200 pt-8">
        <div>
          <p className="text-sm font-medium text-gray-600">Team Size</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{profile.teamSize}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Experience Level</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">
            {profile.experienceLevel === 'lead' ? 'Lead' : `${profile.experienceLevel.charAt(0).toUpperCase()}${profile.experienceLevel.slice(1)} Level`}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Joined</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Last Updated</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {new Date(profile.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
