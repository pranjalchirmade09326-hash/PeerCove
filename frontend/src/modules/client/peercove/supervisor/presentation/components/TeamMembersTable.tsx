/**
 * Component: TeamMembersTable
 * Displays team members under supervisor with status and performance
 * Presentation layer - React component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SupervisorServiceImpl } from '../../infrastructure/services/SupervisorServiceImpl';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
  performance: number;
}

interface TeamMembersTableProps {
  supervisorId: string;
  limit?: number;
}

export function TeamMembersTable({ supervisorId, limit = 10 }: TeamMembersTableProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'joinDate'>('name');

  const service = new SupervisorServiceImpl();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const rawMembers = await service.getTeamMembers(supervisorId, {
          limit,
          offset: 0,
        });

        // Map raw members to TeamMember format
        const formattedMembers: TeamMember[] = rawMembers.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          department: member.department,
          role: member.role,
          status: member.status,
          joinDate: member.join_date,
          performance: member.performance,
        }));

        setMembers(formattedMembers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    if (supervisorId) {
      fetchTeamMembers();
    }
  }, [supervisorId, limit]);

  const sortedMembers = [...members].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'performance':
        return b.performance - a.performance;
      case 'joinDate':
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      default:
        return 0;
    }
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 4) return 'text-green-600';
    if (performance >= 3) return 'text-blue-600';
    if (performance >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-600">{members.length} members</p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="performance">Sort by Performance</option>
            <option value="joinDate">Sort by Join Date</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2 p-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-gray-600">No team members found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Performance</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Join Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-sm font-bold text-white">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-gray-900">{member.role}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-gray-900">{member.department}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(member.status)}`}>
                      {member.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full ${member.performance >= 4 ? 'bg-green-500' : member.performance >= 3 ? 'bg-blue-500' : member.performance >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${(member.performance / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getPerformanceColor(member.performance)}`}>
                        {member.performance.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-gray-900">
                      {new Date(member.joinDate).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
