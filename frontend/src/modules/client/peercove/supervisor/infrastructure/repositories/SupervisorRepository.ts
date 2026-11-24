/**
 * Infrastructure: Supervisor Repository
 * Handles all API communication and response mapping
 * Infrastructure layer - isolates domain from API details
 */

import { SupervisorProfile } from '../../domain/entities/SupervisorProfile';
import { SupervisorStats } from '../../domain/entities/SupervisorStats';

interface SupervisorProfileDTO {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  team_size: number;
  performance_rating: number;
  department: string;
  experience_level: 'junior' | 'mid' | 'senior' | 'lead';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupervisorStatsDTO {
  supervisor_id: string;
  team_members: number;
  active_sessions: number;
  avg_quality_score: number;
  total_workload: number;
  team_productivity: number;
  created_at: string;
  updated_at: string;
}

interface TeamMemberDTO {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'on_leave';
  join_date: string;
  performance: number;
}

export class SupervisorRepository {
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

  async fetchSupervisorProfile(supervisorId: string): Promise<SupervisorProfile> {
    const url = `${this.baseUrl}/api/v1/supervisors/${supervisorId}`;
    const dto = await this.fetchAPI<SupervisorProfileDTO>(url);
    return this.mapToSupervisorProfile(dto);
  }

  async fetchSupervisorStats(supervisorId: string): Promise<SupervisorStats> {
    const url = `${this.baseUrl}/api/v1/supervisors/${supervisorId}/stats`;
    const dto = await this.fetchAPI<SupervisorStatsDTO>(url);
    return this.mapToSupervisorStats(dto);
  }

  async searchSupervisors(
    criteria?: {
      department?: string;
      experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
      minRating?: number;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<SupervisorProfile[]> {
    const params = new URLSearchParams();
    if (criteria?.department) params.append('department', criteria.department);
    if (criteria?.experienceLevel) params.append('experience_level', criteria.experienceLevel);
    if (criteria?.minRating) params.append('min_rating', criteria.minRating.toString());
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const url = `${this.baseUrl}/api/v1/supervisors?${params.toString()}`;
    const dtos = await this.fetchAPI<SupervisorProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToSupervisorProfile(dto));
  }

  async fetchTeamMembers(
    supervisorId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TeamMemberDTO[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const url = `${this.baseUrl}/api/v1/supervisors/${supervisorId}/team-members?${params.toString()}`;
    return this.fetchAPI<TeamMemberDTO[]>(url);
  }

  async updateSupervisorProfile(
    supervisorId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      department: string;
    }>
  ): Promise<SupervisorProfile> {
    const url = `${this.baseUrl}/api/v1/supervisors/${supervisorId}`;
    const payload = {
      first_name: updates.firstName,
      last_name: updates.lastName,
      phone: updates.phone,
      department: updates.department,
    };

    const dto = await this.fetchAPI<SupervisorProfileDTO>(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return this.mapToSupervisorProfile(dto);
  }

  private async fetchAPI<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        if (this.authToken) {
          headers.Authorization = `Bearer ${this.authToken}`;
        }

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data: T = await response.json();
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < this.MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    throw lastError || new Error('Failed after max retries');
  }

  private mapToSupervisorProfile(dto: SupervisorProfileDTO): SupervisorProfile {
    return new SupervisorProfile({
      id: dto.id,
      userId: dto.user_id,
      firstName: dto.first_name,
      lastName: dto.last_name,
      email: dto.email,
      phone: dto.phone,
      teamSize: dto.team_size,
      performanceRating: dto.performance_rating,
      department: dto.department,
      experienceLevel: dto.experience_level,
      isActive: dto.is_active,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }

  private mapToSupervisorStats(dto: SupervisorStatsDTO): SupervisorStats {
    return new SupervisorStats({
      supervisorId: dto.supervisor_id,
      teamMembers: dto.team_members,
      activeSessions: dto.active_sessions,
      avgQualityScore: dto.avg_quality_score,
      totalWorkload: dto.total_workload,
      teamProductivity: dto.team_productivity,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }
}
