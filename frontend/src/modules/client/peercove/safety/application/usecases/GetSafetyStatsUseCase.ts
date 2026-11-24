/**
 * Application Use Case: GetSafetyStatsUseCase
 * Orchestrates fetching safety statistics with calculations
 * Application layer - coordinates domain and infrastructure
 */

import { SafetyStats } from '../../domain/entities/SafetyStats';
import { ISafetyService } from '../../domain/interfaces/ISafetyService';
import {
  GetSafetyStatsInput,
  GetSafetyStatsOutput,
  Result,
} from '../dto/index';

export class GetSafetyStatsUseCase {
  constructor(private safetyService: ISafetyService) {}

  async execute(input: GetSafetyStatsInput): Promise<Result<GetSafetyStatsOutput>> {
    const startTime = performance.now();

    try {
      if (!input.safetyId || input.safetyId.trim() === '') {
        return {
          success: false,
          error: 'Safety ID is required',
          metadata: {
            timestamp: new Date().toISOString(),
            duration: performance.now() - startTime,
          },
        };
      }

      const stats = await this.safetyService.getSafetyStats(input.safetyId);

      const output: GetSafetyStatsOutput = {
        safety_id: stats.safety_id,
        high_risk_users: stats.high_risk_users,
        alerts_active: stats.alerts_active,
        incidents_reported: stats.incidents_reported,
        avg_response_time_minutes: stats.avg_response_time_minutes,
        escalations_made: stats.escalations_made,
        assessment_completion_rate: stats.assessment_completion_rate,
        critical_cases: stats.critical_cases,
        health_score: stats.getOverallHealthScore(),
        system_status: stats.getSystemStatus(),
        created_at: stats.created_at.toISOString(),
        updated_at: stats.updated_at.toISOString(),
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
      console.error('GetSafetyStatsUseCase error:', errorMessage);

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
