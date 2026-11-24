/**
 * Application Use Case: GetAdminStatsUseCase
 * Fetches admin statistics with calculated metrics
 * Application layer - coordinates domain and infrastructure
 */

import { AdminStats } from '../../domain/entities/AdminStats';
import { IAdminService } from '../../domain/interfaces/IAdminService';
import { GetAdminStatsInput, GetAdminStatsOutput, Result } from '../dto/index';

export class GetAdminStatsUseCase {
  constructor(private adminService: IAdminService) {}

  async execute(input: GetAdminStatsInput): Promise<Result<GetAdminStatsOutput>> {
    const startTime = performance.now();

    try {
      if (!input.adminId || input.adminId.trim() === '') {
        return {
          success: false,
          error: 'Admin ID is required',
          metadata: {
            timestamp: new Date().toISOString(),
            duration: performance.now() - startTime,
          },
        };
      }

      const stats = await this.adminService.getAdminStats(input.adminId);

      const output: GetAdminStatsOutput = {
        adminId: stats.adminId,
        totalUsers: stats.totalUsers,
        totalListeners: stats.totalListeners,
        totalReports: stats.totalReports,
        totalSessions: stats.totalSessions,
        activeModeration: stats.activeModeration,
        reportsPending: stats.reportsPending,
        avgResponseTime: stats.avgResponseTime,
        workloadScore: stats.workloadScore(),
        efficiencyRating: stats.efficiencyRating(),
        teamHealth: stats.teamHealth(),
        sessionPerListener: stats.getSessionsPerListener(),
        reportResolutionRate: stats.getReportResolutionRate(),
        moderationProgress: stats.getModerationProgress(),
        systemStatus: stats.getSystemStatus(),
      };

      return {
        success: true,
        data: output,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: performance.now() - startTime,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('GetAdminStatsUseCase error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: performance.now() - startTime,
        },
      };
    }
  }
}
