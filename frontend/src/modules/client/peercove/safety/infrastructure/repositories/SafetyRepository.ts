/**
 * Infrastructure: Safety Repository
 * Handles all API communication and response mapping
 * Infrastructure layer - isolates domain from API details
 */

import { SafetyProfile } from '../../domain/entities/SafetyProfile';
import { SafetyStats } from '../../domain/entities/SafetyStats';
import { GetSafetyStatsOutput, SafetyAlertDTO, Assessment } from '../../application/dto/index';
import {
  SearchCriteria,
  SafetyAlert,
} from '../../domain/interfaces/ISafetyService';

interface SafetyProfileDTO {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  risk_score: number;
  status: 'low' | 'medium' | 'high' | 'critical';
  last_assessment_date: string;
  needs_intervention: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SafetyStatsDTO {
  safety_id: string;
  high_risk_users: number;
  alerts_active: number;
  incidents_reported: number;
  avg_response_time_minutes: number;
  escalations_made: number;
  assessment_completion_rate: number;
  critical_cases: number;
  created_at: string;
  updated_at: string;
}

export class SafetyRepository {
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

  async fetchSafetyProfile(profileId: string): Promise<SafetyProfile> {
    const url = `${this.baseUrl}/api/v1/safety/profiles/${profileId}`;
    const dto = await this.fetchAPI<SafetyProfileDTO>(url);
    return this.mapToSafetyProfile(dto);
  }

  async fetchSafetyStats(safetyId: string): Promise<SafetyStats> {
    const url = `${this.baseUrl}/api/v1/safety/stats/${safetyId}`;
    const dto = await this.fetchAPI<SafetyStatsDTO>(url);
    return this.mapToSafetyStats(dto);
  }

  async getAggregatedStats(): Promise<SafetyStats> {
    const url = `${this.baseUrl}/api/v1/safety/stats/aggregated`;
    const dto = await this.fetchAPI<SafetyStatsDTO>(url);
    return this.mapToSafetyStats(dto);
  }

  async searchProfiles(criteria: SearchCriteria): Promise<SafetyProfile[]> {
    const params = new URLSearchParams();
    if (criteria.status) params.append('status', criteria.status);
    if (criteria.riskScoreMin !== undefined) params.append('risk_score_min', criteria.riskScoreMin.toString());
    if (criteria.riskScoreMax !== undefined) params.append('risk_score_max', criteria.riskScoreMax.toString());
    if (criteria.needsIntervention !== undefined) params.append('needs_intervention', criteria.needsIntervention.toString());
    if (criteria.limit) params.append('limit', criteria.limit.toString());
    if (criteria.offset) params.append('offset', criteria.offset.toString());

    const url = `${this.baseUrl}/api/v1/safety/profiles/search?${params.toString()}`;
    const dtos = await this.fetchAPI<SafetyProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToSafetyProfile(dto));
  }

  async getHighRiskProfiles(limit: number = 20): Promise<SafetyProfile[]> {
    const url = `${this.baseUrl}/api/v1/safety/profiles/high-risk?limit=${limit}`;
    const dtos = await this.fetchAPI<SafetyProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToSafetyProfile(dto));
  }

  async getCriticalProfiles(limit: number = 20): Promise<SafetyProfile[]> {
    const url = `${this.baseUrl}/api/v1/safety/profiles/critical?limit=${limit}`;
    const dtos = await this.fetchAPI<SafetyProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToSafetyProfile(dto));
  }

  async getActiveAlerts(limit: number = 50): Promise<SafetyAlert[]> {
    const url = `${this.baseUrl}/api/v1/safety/alerts/active?limit=${limit}`;
    return this.fetchAPI<SafetyAlert[]>(url);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/safety/alerts/${alertId}/acknowledge`;
    await this.fetchAPI(url, { method: 'POST' });
  }

  async escalateAlert(alertId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/safety/alerts/${alertId}/escalate`;
    await this.fetchAPI(url, { method: 'POST' });
  }

  async getRecentAssessments(limit: number = 20): Promise<Assessment[]> {
    const url = `${this.baseUrl}/api/v1/safety/assessments/recent?limit=${limit}`;
    const assessments = await this.fetchAPI<any[]>(url);
    return assessments.map(a => ({
      ...a,
      created_at: a.created_at.toString(),
      updated_at: a.updated_at.toString(),
    }));
  }

  async updateAssessment(profileId: string, data: any): Promise<void> {
    const url = `${this.baseUrl}/api/v1/safety/profiles/${profileId}/assessment`;
    await this.fetchAPI(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  private mapToSafetyProfile(dto: SafetyProfileDTO): SafetyProfile {
    return new SafetyProfile({
      id: dto.id,
      user_id: dto.user_id,
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      phone: dto.phone,
      risk_score: dto.risk_score,
      status: dto.status,
      last_assessment_date: new Date(dto.last_assessment_date),
      needs_intervention: dto.needs_intervention,
      is_active: dto.is_active,
      created_at: new Date(dto.created_at),
      updated_at: new Date(dto.updated_at),
    });
  }

  private mapToSafetyStats(dto: SafetyStatsDTO): SafetyStats {
    return new SafetyStats({
      safety_id: dto.safety_id,
      high_risk_users: dto.high_risk_users,
      alerts_active: dto.alerts_active,
      incidents_reported: dto.incidents_reported,
      avg_response_time_minutes: dto.avg_response_time_minutes,
      escalations_made: dto.escalations_made,
      assessment_completion_rate: dto.assessment_completion_rate,
      critical_cases: dto.critical_cases,
      created_at: new Date(dto.created_at),
      updated_at: new Date(dto.updated_at),
    });
  }
}
