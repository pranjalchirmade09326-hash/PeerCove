/**
 * Application Use Case: GetSafetyProfileUseCase
 * Orchestrates fetching safety profile with domain logic
 * Application layer - coordinates domain and infrastructure
 */

import { SafetyProfile } from '../../domain/entities/SafetyProfile';
import { ISafetyService } from '../../domain/interfaces/ISafetyService';
import {
  GetSafetyProfileInput,
  GetSafetyProfileOutput,
  Result,
} from '../dto/index';

export class GetSafetyProfileUseCase {
  constructor(private safetyService: ISafetyService) {}

  async execute(input: GetSafetyProfileInput): Promise<Result<GetSafetyProfileOutput>> {
    const startTime = performance.now();

    try {
      if (!input.profileId || input.profileId.trim() === '') {
        return {
          success: false,
          error: 'Safety Profile ID is required',
          metadata: {
            timestamp: new Date().toISOString(),
            duration: performance.now() - startTime,
          },
        };
      }

      const profile = await this.safetyService.getSafetyProfile(input.profileId);

      const output: GetSafetyProfileOutput = {
        id: profile.id,
        user_id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        risk_score: profile.risk_score,
        status: profile.status,
        last_assessment_date: profile.last_assessment_date.toISOString(),
        needs_intervention: profile.needs_intervention,
        is_active: profile.is_active,
        created_at: profile.created_at.toISOString(),
        updated_at: profile.updated_at.toISOString(),
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
      console.error('GetSafetyProfileUseCase error:', errorMessage);

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
