/**
 * Get Dashboard Stats Use Case - Application Layer
 *
 * Orchestrates retrieving member dashboard statistics.
 *
 * Layer: Application
 */

import { IMemberService } from "../../domain/interfaces/IMemberService";
import { DashboardStats } from "../../domain/entities/DashboardStats";

export interface GetDashboardStatsInput {
  userId: string;
}

export interface GetDashboardStatsOutput {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

export class GetDashboardStatsUseCase {
  constructor(private memberService: IMemberService) {
    if (!memberService) {
      throw new Error("GetDashboardStatsUseCase: memberService is required");
    }
  }

  async execute(input: GetDashboardStatsInput): Promise<GetDashboardStatsOutput> {
    try {
      // Validate input
      if (!input.userId?.trim()) {
        return {
          success: false,
          error: "userId is required",
        };
      }

      // Fetch from service
      const stats = await this.memberService.getDashboardStats(input.userId);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard stats";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
