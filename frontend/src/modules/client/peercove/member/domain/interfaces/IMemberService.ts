/**
 * Member Service Interface - Domain Layer
 *
 * Defines the contract for member-related operations.
 * This interface must be implemented by infrastructure services.
 *
 * Layer: Domain
 */

import { MemberProfile } from "../entities/MemberProfile";
import { DashboardStats } from "../entities/DashboardStats";

export interface IMemberService {
  /**
   * Fetch member profile by user ID
   * @param userId User ID from authentication
   * @throws Error if member not found or API call fails
   */
  getMemberProfile(userId: string): Promise<MemberProfile>;

  /**
   * Fetch dashboard statistics for a member
   * @param userId User ID from authentication
   * @throws Error if stats cannot be fetched
   */
  getDashboardStats(userId: string): Promise<DashboardStats>;

  /**
   * Update member profile information
   * @param userId User ID from authentication
   * @param updates Partial profile updates
   * @throws Error if update fails
   */
  updateMemberProfile(
    userId: string,
    updates: Partial<{
      displayName: string;
      bio: string;
      avatar: string;
    }>
  ): Promise<MemberProfile>;

  /**
   * Fetch member's recent wellness data
   * @param userId User ID from authentication
   * @param limit Maximum number of records
   */
  getRecentWellnessData(
    userId: string,
    limit?: number
  ): Promise<Array<{
    id: string;
    type: "mood" | "activity" | "goal";
    value: string | number;
    recordedAt: Date;
  }>>;
}
