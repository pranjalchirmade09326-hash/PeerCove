/**
 * Application Use Case: GetListenerProfileUseCase
 * Orchestrates fetching listener profile with domain logic
 * Application layer - coordinates domain and infrastructure
 */

import { ListenerProfile } from '../../domain/entities/ListenerProfile';
import { IListenerService } from '../../domain/interfaces/IListenerService';
import {
  GetListenerProfileInput,
  GetListenerProfileOutput,
  Result,
} from '../dto/index';

export class GetListenerProfileUseCase {
  constructor(private listenerService: IListenerService) {}

  async execute(input: GetListenerProfileInput): Promise<Result<GetListenerProfileOutput>> {
    const startTime = performance.now();

    try {
      if (!input.listenerId || input.listenerId.trim() === '') {
        return {
          success: false,
          error: 'Listener ID is required',
          metadata: {
            timestamp: new Date().toISOString(),
            duration: performance.now() - startTime,
          },
        };
      }

      const profile = await this.listenerService.getListenerProfile(input.listenerId);

      const output: GetListenerProfileOutput = {
        id: profile.id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        specializations: profile.specializations,
        licenseNumber: profile.licenseNumber,
        yearsOfExperience: profile.yearsOfExperience,
        bio: profile.bio,
        profileImageUrl: profile.profileImageUrl,
        isActive: profile.isActive,
        verificationStatus: profile.verificationStatus,
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
      console.error('GetListenerProfileUseCase error:', errorMessage);

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
