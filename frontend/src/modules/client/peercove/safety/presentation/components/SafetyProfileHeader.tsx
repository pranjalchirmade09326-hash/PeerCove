/**
 * Presentation Component: SafetyProfileHeader
 * Displays profile header with risk indicators and key information
 * Presentation layer - pure UI component
 */

'use client';

import React from 'react';
import { getRiskColor } from '../../config/safety.config';

interface SafetyProfileHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  riskScore: number;
  status: 'low' | 'medium' | 'high' | 'critical';
  needsIntervention: boolean;
  isActive: boolean;
}

export function SafetyProfileHeader({
  firstName,
  lastName,
  email,
  phone,
  riskScore,
  status,
  needsIntervention,
  isActive,
}: SafetyProfileHeaderProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const riskColor = getRiskColor(status);
  const statusBgColor =
    status === 'critical'
      ? 'bg-red-100'
      : status === 'high'
        ? 'bg-orange-100'
        : status === 'medium'
          ? 'bg-yellow-100'
          : 'bg-green-100';

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: riskColor }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {firstName} {lastName}
            </h1>
            <p className="text-gray-600">{email}</p>
            {phone && <p className="text-gray-600">{phone}</p>}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`inline-block px-4 py-2 rounded-full text-white font-semibold ${statusBgColor}`}
            style={{ backgroundColor: riskColor + '20', color: riskColor }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} Risk
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-600 text-sm font-semibold">Risk Score</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-gray-200 rounded">
              <div
                className="h-2 rounded"
                style={{
                  width: `${riskScore}%`,
                  backgroundColor: riskColor,
                }}
              ></div>
            </div>
            <p className="text-lg font-bold" style={{ color: riskColor }}>
              {riskScore}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-600 text-sm font-semibold">Status</p>
          <p className="text-lg font-bold mt-2 text-gray-900 capitalize">
            {isActive ? 'Active' : 'Inactive'}
          </p>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-600 text-sm font-semibold">Intervention</p>
          <p className="text-lg font-bold mt-2">
            {needsIntervention ? (
              <span className="text-red-600">Required</span>
            ) : (
              <span className="text-green-600">Not Required</span>
            )}
          </p>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-600 text-sm font-semibold">Severity</p>
          <div className="mt-2 flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded"
                style={{
                  backgroundColor: i < ['low', 'medium', 'high', 'critical'].indexOf(status) + 1
                    ? riskColor
                    : '#e5e7eb',
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
