/**
 * Application DTO (Data Transfer Object)
 * Input/Output types for use cases
 * Decouples API contracts from domain entities
 */

// Input DTOs
export interface GetAdminProfileInput {
  adminId: string;
}

export interface GetAdminStatsInput {
  adminId: string;
}

export interface SearchAdminInput {
  query?: string;
  role?: 'super-admin' | 'moderator' | 'analyst';
  departmentId?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateAdminProfileInput {
  adminId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  permissions?: string[];
  accessLevel?: 1 | 2 | 3 | 4 | 5;
}

// Output DTOs
export interface GetAdminProfileOutput {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super-admin' | 'moderator' | 'analyst';
  permissions: string[];
  departmentId: string;
  accessLevel: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetAdminStatsOutput {
  adminId: string;
  totalUsers: number;
  totalListeners: number;
  totalReports: number;
  totalSessions: number;
  activeModeration: number;
  reportsPending: number;
  avgResponseTime: number;
  workloadScore: number;
  efficiencyRating: number;
  teamHealth: 'healthy' | 'warning' | 'critical';
  sessionPerListener: number;
  reportResolutionRate: number;
  moderationProgress: number;
  systemStatus: 'optimal' | 'nominal' | 'degraded';
}

export interface SearchAdminOutput {
  admins: GetAdminProfileOutput[];
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
