/**
 * Infrastructure: Admin Repository
 * Handles all API communication and response mapping
 * Infrastructure layer - isolates domain from API details
 */

import { AdminProfile } from '../../domain/entities/AdminProfile';
import { AdminStats } from '../../domain/entities/AdminStats';

interface AdminProfileDTO {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'super-admin' | 'moderator' | 'analyst';
  permissions: string[];
  department_id: string;
  access_level: 1 | 2 | 3 | 4 | 5;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminStatsDTO {
  admin_id: string;
  total_users: number;
  total_listeners: number;
  total_reports: number;
  total_sessions: number;
  active_moderation: number;
  reports_pending: number;
  avg_response_time: number;
  created_at: string;
  updated_at: string;
}

export class AdminRepository {
  private baseUrl: string;
  private authToken: string = '';
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  async fetchAdminProfile(adminId: string): Promise<AdminProfile> {
    const url = `${this.baseUrl}/api/v1/admins/${adminId}`;
    const dto = await this.fetchAPI<AdminProfileDTO>(url);
    return this.mapToAdminProfile(dto);
  }

  async fetchAdminStats(adminId: string): Promise<AdminStats> {
    const url = `${this.baseUrl}/api/v1/admins/${adminId}/stats`;
    const dto = await this.fetchAPI<AdminStatsDTO>(url);
    return this.mapToAdminStats(dto);
  }

  async updateAdminProfile(adminId: string, updates: Partial<AdminProfileDTO>): Promise<AdminProfile> {
    const url = `${this.baseUrl}/api/v1/admins/${adminId}`;
    const dto = await this.fetchAPI<AdminProfileDTO>(url, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return this.mapToAdminProfile(dto);
  }

  async searchAdmins(query?: string, limit: number = 20): Promise<AdminProfile[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('limit', limit.toString());

    const url = `${this.baseUrl}/api/v1/admins/search?${params.toString()}`;
    const dtos = await this.fetchAPI<AdminProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToAdminProfile(dto));
  }

  async checkPermission(adminId: string, permission: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/admins/${adminId}/permissions/${permission}`;
      const response = await this.fetchAPI<{ hasPermission: boolean }>(url);
      return response.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async getAdminsByDepartment(departmentId: string): Promise<AdminProfile[]> {
    const url = `${this.baseUrl}/api/v1/admins/department/${departmentId}`;
    const dtos = await this.fetchAPI<AdminProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToAdminProfile(dto));
  }

  async getDepartmentStats(departmentId: string): Promise<AdminStats> {
    const url = `${this.baseUrl}/api/v1/departments/${departmentId}/stats`;
    const dto = await this.fetchAPI<AdminStatsDTO>(url);
    return this.mapToAdminStats(dto);
  }

  private async fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
            ...options.headers,
          },
          timeout: this.DEFAULT_TIMEOUT,
        });

        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }

        if (response.status === 403) {
          throw new Error('Forbidden: Access denied');
        }

        if (response.status === 404) {
          throw new Error('Not found: Resource does not exist');
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.MAX_RETRIES && !String(lastError.message).includes('Unauthorized')) {
          await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY * attempt));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Failed to fetch data after retries');
  }

  private mapToAdminProfile(dto: AdminProfileDTO): AdminProfile {
    return new AdminProfile({
      id: dto.id,
      userId: dto.user_id,
      firstName: dto.first_name,
      lastName: dto.last_name,
      email: dto.email,
      role: dto.role,
      permissions: dto.permissions,
      departmentId: dto.department_id,
      accessLevel: dto.access_level,
      isActive: dto.is_active,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }

  private mapToAdminStats(dto: AdminStatsDTO): AdminStats {
    return new AdminStats({
      adminId: dto.admin_id,
      totalUsers: dto.total_users,
      totalListeners: dto.total_listeners,
      totalReports: dto.total_reports,
      totalSessions: dto.total_sessions,
      activeModeration: dto.active_moderation,
      reportsPending: dto.reports_pending,
      avgResponseTime: dto.avg_response_time,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }
}
