/**
 * Application Use Case: GetSupervisorStatsUseCase
 * Orchestrates retrieval and calculation of supervisor statistics
 * Application layer - use case logic
 */

import { SupervisorStats } from '../../domain/entities/SupervisorStats';
import { ISupervisorService } from '../../domain/interfaces/ISupervisorService';
import {
  GetSupervisorStatsInput,
  GetSupervisorStatsOutput,
  Result,
} from '../dto/index';

export class GetSupervisorStatsUseCase {
  constructor(private supervisorService: ISupervisorService) {}

  async execute(input: GetSupervisorStatsInput): Promise<Result<GetSupervisorStatsOutput>> {
    try {
      // Input validation
      if (!input.supervisorId || input.supervisorId.trim() === '') {
        return {
          success: false,
          error: 'Supervisor ID is required',
        };
      }

      const startTime = performance.now();

      // Business logic
      const stats: SupervisorStats = await this.supervisorService.getSupervisorStats(
        input.supervisorId
      );

      const output: GetSupervisorStatsOutput = {
        supervisorId: stats.supervisorId,
        teamMembers: stats.teamMembers,
        activeSessions: stats.activeSessions,
        avgQualityScore: stats.avgQualityScore,
        totalWorkload: stats.totalWorkload,
        teamProductivity: stats.teamProductivity,
        healthScore: stats.getHealthScore(),
        qualityStatus: stats.getQualityStatus(),
        productivityStatus: stats.getProductivityStatus(),
        workloadLevel: stats.getWorkloadLevel(),
        sessionUtilization: stats.getSessionUtilization(),
        avgWorkloadPerMember: stats.getAverageWorkloadPerMember(),
        needsAttention: stats.getNeedsAttention(),
        createdAt: stats.createdAt.toISOString(),
        updatedAt: stats.updatedAt.toISOString(),
      };

      const duration = performance.now() - startTime;

      return {
        success: true,
        data: output,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Math.round(duration),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch supervisor stats';

      return {
        success: false,
        error: errorMessage,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: 0,
        },
      };
    }
  }
}
