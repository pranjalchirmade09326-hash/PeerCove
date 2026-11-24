/**
 * Member Service Implementation - Infrastructure Layer
 *
 * Implements the IMemberService interface.
 * Coordinates with repository for data access.
 *
 * Layer: Infrastructure
 */

import { IMemberService } from "../../domain/interfaces/IMemberService";
import { MemberProfile } from "../../domain/entities/MemberProfile";
import { DashboardStats } from "../../domain/entities/DashboardStats";
import { MemberRepository } from "../repositories/MemberRepository";

export class MemberServiceImpl implements IMemberService {
  private repository: MemberRepository;

  constructor(repository?: MemberRepository) {
    this.repository = repository || new MemberRepository();
  }

  /**
   * Set authorization token for all requests
   */
  setAuthToken(token: string): void {
    this.repository.setAuthToken(token);
  }

  /**
   * Implement IMemberService.getMemberProfile
   */
  async getMemberProfile(userId: string): Promise<MemberProfile> {
    if (!userId?.trim()) {
      throw new Error("getMemberProfile: userId is required");
    }

    try {
      return await this.repository.fetchProfile(userId);
    } catch (error) {
      throw new Error(
        `MemberService.getMemberProfile failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Implement IMemberService.getDashboardStats
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    if (!userId?.trim()) {
      throw new Error("getDashboardStats: userId is required");
    }

    try {
      return await this.repository.fetchDashboardStats(userId);
    } catch (error) {
      throw new Error(
        `MemberService.getDashboardStats failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Implement IMemberService.updateMemberProfile
   */
  async updateMemberProfile(
    userId: string,
    updates: Partial<{
      displayName: string;
      bio: string;
      avatar: string;
    }>
  ): Promise<MemberProfile> {
    if (!userId?.trim()) {
      throw new Error("updateMemberProfile: userId is required");
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("updateMemberProfile: at least one field must be updated");
    }

    try {
      // TODO: Implement update logic when backend endpoint is available
      throw new Error("Profile update not yet implemented");
    } catch (error) {
      throw new Error(
        `MemberService.updateMemberProfile failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Implement IMemberService.getRecentWellnessData
   */
  async getRecentWellnessData(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{
      id: string;
      type: "mood" | "activity" | "goal";
      value: string | number;
      recordedAt: Date;
    }>
  > {
    if (!userId?.trim()) {
      throw new Error("getRecentWellnessData: userId is required");
    }

    if (limit < 1 || limit > 100) {
      throw new Error("getRecentWellnessData: limit must be between 1 and 100");
    }

    try {
      return await this.repository.fetchRecentWellness(userId, limit);
    } catch (error) {
      throw new Error(
        `MemberService.getRecentWellnessData failed: ${this.getErrorMessage(error)}`
      );
    }
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
