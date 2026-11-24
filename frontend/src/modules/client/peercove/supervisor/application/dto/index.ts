/**
 * Application DTO (Data Transfer Object)
 * Input/Output types for use cases
 * Decouples API contracts from domain entities
 */

// Input DTOs
export interface GetSupervisorProfileInput {
  supervisorId: string;
}

export interface GetSupervisorStatsInput {
  supervisorId: string;
}

export interface GetTeamMembersInput {
  supervisorId: string;
  limit?: number;
  offset?: number;
}

export interface SearchSupervisorsInput {
  department?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
  minRating?: number;
  maxTeamSize?: number;
  limit?: number;
  offset?: number;
}

export interface UpdateSupervisorProfileInput {
  supervisorId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
}

// Output DTOs
export interface GetSupervisorProfileOutput {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  teamSize: number;
  performanceRating: number;
  department: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetSupervisorStatsOutput {
  supervisorId: string;
  teamMembers: number;
  activeSessions: number;
  avgQualityScore: number;
  totalWorkload: number;
  teamProductivity: number;
  healthScore: number;
  qualityStatus: 'excellent' | 'good' | 'fair' | 'poor';
  productivityStatus: 'high' | 'normal' | 'low';
  workloadLevel: 'low' | 'moderate' | 'high' | 'critical';
  sessionUtilization: number;
  avgWorkloadPerMember: number;
  needsAttention: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberOutput {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
  performance: number;
}

export interface GetTeamMembersOutput {
  supervisorId: string;
  members: TeamMemberOutput[];
  total: number;
  hasMore: boolean;
}

export interface SearchSupervisorsOutput {
  supervisors: GetSupervisorProfileOutput[];
  total: number;
  hasMore: boolean;
}

// Result wrapper
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    duration: number;
  };
}
