/**
 * Member Repository - Infrastructure Layer
 *
 * Handles data access to member-related endpoints.
 * Maps API responses to domain entities.
 *
 * Layer: Infrastructure
 */

import { MemberProfile, MemberProfileDTO } from "../../domain/entities/MemberProfile";
import { DashboardStats, DashboardStatsDTO } from "../../domain/entities/DashboardStats";

export interface IMemberRepository {
  fetchProfile(userId: string): Promise<MemberProfile>;
  fetchDashboardStats(userId: string): Promise<DashboardStats>;
  fetchRecentWellness(userId: string, limit: number): Promise<Array<{
    id: string;
    type: "mood" | "activity" | "goal";
    value: string | number;
    recordedAt: Date;
  }>>;
}

export class MemberRepository implements IMemberRepository {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = "http://localhost:8080/api/v1") {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authorization token for authenticated requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Fetch member profile from backend
   */
  async fetchProfile(userId: string): Promise<MemberProfile> {
    try {
      const response = await this.fetchAPI(`/members/${userId}`);
      const data = response.data as MemberProfileDTO;

      return new MemberProfile({
        id: data.id,
        userId: data.userId,
        displayName: data.displayName,
        email: data.email,
        avatar: data.avatar,
        bio: data.bio,
        organization: data.organization,
        joinedDate: new Date(data.joinedDate),
        lastActive: new Date(data.lastActive),
      });
    } catch (error) {
      throw new Error(`Failed to fetch member profile: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Fetch dashboard statistics from backend
   */
  async fetchDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const response = await this.fetchAPI(`/members/${userId}/dashboard`);
      const data = response.data as DashboardStatsDTO;

      return new DashboardStats({
        checkinsThisWeek: data.checkinsThisWeek || 0,
        savedReflections: data.savedReflections || 0,
        activeGoals: data.activeGoals || 0,
        openSupportRequests: data.openSupportRequests || 0,
        openConversations: data.openConversations || 0,
        queuedNotifications: data.queuedNotifications || 0,
        openPrivacyRequests: data.openPrivacyRequests || 0,
        totalAppointments: data.totalAppointments || 0,
        completedAppointments: data.completedAppointments || 0,
        pendingAppointments: data.pendingAppointments || 0,
        cancelledAppointments: data.cancelledAppointments || 0,
      });
    } catch (error) {
      throw new Error(`Failed to fetch dashboard stats: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Fetch recent wellness data from backend
   */
  async fetchRecentWellness(
    userId: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    type: "mood" | "activity" | "goal";
    value: string | number;
    recordedAt: Date;
  }>> {
    try {
      const response = await this.fetchAPI(
        `/members/${userId}/wellness?limit=${limit}`
      );
      const data = response.data as Array<{
        id: string;
        type: "mood" | "activity" | "goal";
        value: string | number;
        recordedAt: string;
      }>;

      return data.map((item) => ({
        ...item,
        recordedAt: new Date(item.recordedAt),
      }));
    } catch (error) {
      throw new Error(`Failed to fetch wellness data: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Generic API fetch with error handling
   */
  private async fetchAPI(endpoint: string): Promise<{ data: unknown }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (response.status === 404) {
        throw new Error("Not found");
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();
    return { data: json };
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "Unknown error";
  }
}
