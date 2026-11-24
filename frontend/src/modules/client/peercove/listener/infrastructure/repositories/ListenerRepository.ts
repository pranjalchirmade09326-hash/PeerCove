/**
 * Infrastructure: Listener Repository
 * Handles all API communication and response mapping
 * Infrastructure layer - isolates domain from API details
 */

import { ListenerProfile } from '../../domain/entities/ListenerProfile';
import { ListenerStats } from '../../domain/entities/ListenerStats';
import { GetListenerStatsOutput } from '../../application/dto/index';

interface ListenerProfileDTO {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  specializations: string[];
  license_number: string;
  years_of_experience: number;
  bio?: string;
  profile_image_url?: string;
  is_active: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface ListenerStatsDTO {
  listener_id: string;
  total_clients: number;
  active_clients: number;
  completed_sessions: number;
  total_session_hours: number;
  average_rating: number;
  total_reviews: number;
  response_time_minutes: number;
  available_slots: number;
  upcoming_appointments: number;
  cancellation_rate: number;
  created_at: string;
  updated_at: string;
}

export class ListenerRepository {
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

  async fetchListenerProfile(listenerId: string): Promise<ListenerProfile> {
    const url = `${this.baseUrl}/api/v1/listeners/${listenerId}`;
    const dto = await this.fetchAPI<ListenerProfileDTO>(url);
    return this.mapToListenerProfile(dto);
  }

  async fetchListenerStats(listenerId: string): Promise<ListenerStats> {
    const url = `${this.baseUrl}/api/v1/listeners/${listenerId}/stats`;
    const dto = await this.fetchAPI<ListenerStatsDTO>(url);
    return this.mapToListenerStats(dto);
  }

  async searchListeners(specialization?: string, limit: number = 20): Promise<ListenerProfile[]> {
    const params = new URLSearchParams();
    if (specialization) params.append('specialization', specialization);
    params.append('limit', limit.toString());

    const url = `${this.baseUrl}/api/v1/listeners/search?${params.toString()}`;
    const dtos = await this.fetchAPI<ListenerProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToListenerProfile(dto));
  }

  async getAvailableListeners(limit: number = 20): Promise<ListenerProfile[]> {
    const url = `${this.baseUrl}/api/v1/listeners/available?limit=${limit}`;
    const dtos = await this.fetchAPI<ListenerProfileDTO[]>(url);
    return dtos.map((dto) => this.mapToListenerProfile(dto));
  }

  async checkAvailability(listenerId: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/listeners/${listenerId}/availability`;
      const response = await this.fetchAPI<{ available: boolean }>(url);
      return response.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
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

  private mapToListenerProfile(dto: ListenerProfileDTO): ListenerProfile {
    return new ListenerProfile({
      id: dto.id,
      userId: dto.user_id,
      firstName: dto.first_name,
      lastName: dto.last_name,
      email: dto.email,
      phoneNumber: dto.phone_number,
      specializations: dto.specializations,
      licenseNumber: dto.license_number,
      yearsOfExperience: dto.years_of_experience,
      bio: dto.bio,
      profileImageUrl: dto.profile_image_url,
      isActive: dto.is_active,
      verificationStatus: dto.verification_status,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }

  private mapToListenerStats(dto: ListenerStatsDTO): ListenerStats {
    return new ListenerStats({
      listenerId: dto.listener_id,
      totalClients: dto.total_clients,
      activeClients: dto.active_clients,
      completedSessions: dto.completed_sessions,
      totalSessionHours: dto.total_session_hours,
      averageRating: dto.average_rating,
      totalReviews: dto.total_reviews,
      responseTimeMinutes: dto.response_time_minutes,
      availableSlots: dto.available_slots,
      upcomingAppointments: dto.upcoming_appointments,
      cancellationRate: dto.cancellation_rate,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    });
  }
}
