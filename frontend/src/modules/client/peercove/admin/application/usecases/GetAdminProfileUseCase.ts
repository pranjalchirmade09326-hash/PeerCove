/**
 * Application Use Case: GetAdminProfileUseCase
 * Orchestrates fetching admin profile with domain logic
 * Application layer - coordinates domain and infrastructure
 */

import { AdminProfile } from '../../domain/entities/AdminProfile';
import { IAdminService } from '../../domain/interfaces/IAdminService';
import { GetAdminProfileInput, GetAdminProfileOutput, Result } from '../dto/index';

export class GetAdminProfileUseCase {
  constructor(private adminService: IAdminService) {}

  async execute(input: GetAdminProfileInput): Promise<Result<GetAdminProfileOutput>> {
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

      const profile = await this.adminService.getAdminProfile(input.adminId);

      const output: GetAdminProfileOutput = {
        id: profile.id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        role: profile.role,
        permissions: profile.permissions,
        departmentId: profile.departmentId,
        accessLevel: profile.accessLevel,
        isActive: profile.isActive,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
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
      console.error('GetAdminProfileUseCase error:', errorMessage);

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
