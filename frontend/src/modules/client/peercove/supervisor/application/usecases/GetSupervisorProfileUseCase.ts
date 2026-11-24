/**
 * Application Use Case: GetSupervisorProfileUseCase
 * Orchestrates retrieval and validation of supervisor profile
 * Application layer - use case logic
 */

import { SupervisorProfile } from '../../domain/entities/SupervisorProfile';
import { ISupervisorService } from '../../domain/interfaces/ISupervisorService';
import {
  GetSupervisorProfileInput,
  GetSupervisorProfileOutput,
  Result,
} from '../dto/index';

export class GetSupervisorProfileUseCase {
  constructor(private supervisorService: ISupervisorService) {}

  async execute(input: GetSupervisorProfileInput): Promise<Result<GetSupervisorProfileOutput>> {
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
      const profile: SupervisorProfile = await this.supervisorService.getSupervisorProfile(
        input.supervisorId
      );

      const output: GetSupervisorProfileOutput = {
        id: profile.id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        teamSize: profile.teamSize,
        performanceRating: profile.performanceRating,
        department: profile.department,
        experienceLevel: profile.experienceLevel,
        isActive: profile.isActive,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch supervisor profile';

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
