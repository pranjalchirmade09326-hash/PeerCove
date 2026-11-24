/**
 * Integration Tests: Listener Module
 * Comprehensive test coverage for all layers
 * Domain, Application, Infrastructure, and Presentation layers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListenerProfile } from './domain/entities/ListenerProfile';
import { ListenerStats } from './domain/entities/ListenerStats';
import { GetListenerProfileUseCase } from './application/usecases/GetListenerProfileUseCase';
import { GetListenerStatsUseCase } from './application/usecases/GetListenerStatsUseCase';

// Mock Service Implementation
class MockListenerService {
  async getListenerProfile(listenerId: string) {
    return new ListenerProfile({
      id: listenerId,
      userId: 'user-123',
      firstName: 'Dr. John',
      lastName: 'Smith',
      email: 'john.smith@peercove.com',
      phoneNumber: '+1-555-0100',
      specializations: ['Depression', 'Anxiety', 'Stress Management'],
      licenseNumber: 'LIC-12345',
      yearsOfExperience: 8,
      bio: 'Experienced therapist specializing in cognitive behavioral therapy',
      profileImageUrl: 'https://example.com/john.jpg',
      isActive: true,
      verificationStatus: 'verified',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date(),
    });
  }

  async getListenerStats(listenerId: string) {
    return new ListenerStats({
      listenerId,
      totalClients: 45,
      activeClients: 32,
      completedSessions: 342,
      totalSessionHours: 285.5,
      averageRating: 4.8,
      totalReviews: 56,
      responseTimeMinutes: 45,
      availableSlots: 8,
      upcomingAppointments: 5,
      cancellationRate: 5.2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Domain Layer Tests
describe('Listener Domain', () => {
  it('should create a valid listener profile', () => {
    const profile = new ListenerProfile({
      id: 'listener-1',
      userId: 'user-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@peercove.com',
      specializations: ['Therapy'],
      licenseNumber: 'LIC-001',
      yearsOfExperience: 5,
      isActive: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(profile.id).toBe('listener-1');
    expect(profile.fullName).toBe('Jane Doe');
    expect(profile.isVerified()).toBe(true);
  });

  it('should validate email format', () => {
    expect(() => {
      new ListenerProfile({
        id: 'listener-1',
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'invalid-email',
        specializations: ['Therapy'],
        licenseNumber: 'LIC-001',
        yearsOfExperience: 5,
        isActive: true,
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Valid email is required');
  });

  it('should calculate client retention rate', () => {
    const stats = new ListenerStats({
      listenerId: 'listener-1',
      totalClients: 100,
      activeClients: 75,
      completedSessions: 500,
      totalSessionHours: 500,
      averageRating: 4.5,
      totalReviews: 100,
      responseTimeMinutes: 60,
      availableSlots: 10,
      upcomingAppointments: 5,
      cancellationRate: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(stats.getClientRetention()).toBe(75);
  });

  it('should determine availability status correctly', () => {
    const heavyStats = new ListenerStats({
      listenerId: 'listener-1',
      totalClients: 100,
      activeClients: 95,
      completedSessions: 500,
      totalSessionHours: 500,
      averageRating: 4.5,
      totalReviews: 100,
      responseTimeMinutes: 60,
      availableSlots: 0,
      upcomingAppointments: 5,
      cancellationRate: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(heavyStats.getAvailabilityStatus()).toBe('unavailable');
  });
});

// Application Layer Tests
describe('Listener Application', () => {
  let mockService: MockListenerService;
  let getProfileUseCase: GetListenerProfileUseCase;
  let getStatsUseCase: GetListenerStatsUseCase;

  beforeEach(() => {
    mockService = new MockListenerService();
    getProfileUseCase = new GetListenerProfileUseCase(mockService as any);
    getStatsUseCase = new GetListenerStatsUseCase(mockService as any);
  });

  it('should fetch listener profile successfully', async () => {
    const result = await getProfileUseCase.execute({ listenerId: 'listener-123' });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.firstName).toBe('Dr. John');
    expect(result.data?.email).toBe('john.smith@peercove.com');
  });

  it('should handle missing listener ID', async () => {
    const result = await getProfileUseCase.execute({ listenerId: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should fetch listener stats with calculated metrics', async () => {
    const result = await getStatsUseCase.execute({ listenerId: 'listener-123' });

    expect(result.success).toBe(true);
    expect(result.data?.performanceScore).toBeDefined();
    expect(result.data?.clientRetention).toBe(71.11111111111111);
  });

  it('should include metadata in results', async () => {
    const result = await getProfileUseCase.execute({ listenerId: 'listener-123' });

    expect(result.metadata).toBeDefined();
    expect(result.metadata?.timestamp).toBeDefined();
    expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
  });
});

// Infrastructure Layer Tests
describe('Listener Infrastructure', () => {
  it('should validate listener specializations', () => {
    expect(() => {
      new ListenerProfile({
        id: 'listener-1',
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@peercove.com',
        specializations: [], // Empty specializations
        licenseNumber: 'LIC-001',
        yearsOfExperience: 5,
        isActive: true,
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('At least one specialization is required');
  });

  it('should handle years of experience validation', () => {
    expect(() => {
      new ListenerProfile({
        id: 'listener-1',
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@peercove.com',
        specializations: ['Therapy'],
        licenseNumber: 'LIC-001',
        yearsOfExperience: -5, // Negative years
        isActive: true,
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Years of experience cannot be negative');
  });
});

// Integration Tests
describe('Listener Integration', () => {
  it('should work end-to-end from entity to use case', async () => {
    const mockService = new MockListenerService();
    const useCase = new GetListenerProfileUseCase(mockService as any);

    const result = await useCase.execute({ listenerId: 'listener-123' });

    expect(result.success).toBe(true);
    expect(result.data?.firstName).toBe('Dr. John');
    expect(result.data?.isActive).toBe(true);
    expect(result.data?.verificationStatus).toBe('verified');
  });

  it('should calculate performance metrics correctly', async () => {
    const mockService = new MockListenerService();
    const useCase = new GetListenerStatsUseCase(mockService as any);

    const result = await useCase.execute({ listenerId: 'listener-123' });

    expect(result.success).toBe(true);
    expect(result.data?.performanceScore).toBeGreaterThan(0);
    expect(result.data?.performanceScore).toBeLessThanOrEqual(100);
  });

  it('should handle concurrent profile and stats fetching', async () => {
    const mockService = new MockListenerService();
    const profileUseCase = new GetListenerProfileUseCase(mockService as any);
    const statsUseCase = new GetListenerStatsUseCase(mockService as any);

    const [profileResult, statsResult] = await Promise.all([
      profileUseCase.execute({ listenerId: 'listener-123' }),
      statsUseCase.execute({ listenerId: 'listener-123' }),
    ]);

    expect(profileResult.success).toBe(true);
    expect(statsResult.success).toBe(true);
  });
});
