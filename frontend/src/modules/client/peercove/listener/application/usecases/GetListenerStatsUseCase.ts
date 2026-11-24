/**
 * Application Use Case: GetListenerStatsUseCase
 * Orchestrates fetching and calculating listener statistics
 * Application layer - coordinates domain and infrastructure
 */

import { ListenerStats } from '../../domain/entities/ListenerStats';
import { IListenerService } from '../../domain/interfaces/IListenerService';
import {
  GetListenerStatsInput,
  GetListenerStatsOutput,
  Result,
} from '../dto/index';

export class GetListenerStatsUseCase {
  constructor(private listenerService: IListenerService) {}

  async execute(input: GetListenerStatsInput): Promise<Result<GetListenerStatsOutput>> {
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

      const stats = await this.listenerService.getListenerStats(input.listenerId);

      const output: GetListenerStatsOutput = {
        listenerId: stats.listenerId,
        totalClients: stats.totalClients,
        activeClients: stats.activeClients,
        completedSessions: stats.completedSessions,
        totalSessionHours: stats.totalSessionHours,
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        responseTimeMinutes: stats.responseTimeMinutes,
        availableSlots: stats.availableSlots,
        upcomingAppointments: stats.upcomingAppointments,
        cancellationRate: stats.cancellationRate,
        clientRetention: stats.getClientRetention(),
        averageSessionDuration: stats.getAverageSessionDuration(),
        availabilityStatus: stats.getAvailabilityStatus(),
        performanceScore: stats.getPerformanceScore(),
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
      console.error('GetListenerStatsUseCase error:', errorMessage);

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
