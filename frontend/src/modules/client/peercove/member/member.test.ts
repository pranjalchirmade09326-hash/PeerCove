/**
 * Member Module Integration Tests
 *
 * Comprehensive tests for the member dashboard clean architecture.
 * Tests each layer independently and integration between layers.
 *
 * Layer: Test
 */

import { MemberProfile } from "./domain/entities/MemberProfile";
import { DashboardStats } from "./domain/entities/DashboardStats";
import { GetMemberProfileUseCase } from "./application/usecases/GetMemberProfileUseCase";
import { GetDashboardStatsUseCase } from "./application/usecases/GetDashboardStatsUseCase";
import { MemberRepository } from "./infrastructure/repositories/MemberRepository";
import { MemberServiceImpl } from "./infrastructure/services/MemberServiceImpl";
import { IMemberService } from "./domain/interfaces/IMemberService";

/**
 * Mock Member Service for testing
 */
class MockMemberService implements IMemberService {
  async getMemberProfile(userId: string): Promise<MemberProfile> {
    return new MemberProfile({
      id: "member-1",
      userId,
      displayName: "John Doe",
      email: "john@example.com",
      avatar: "https://example.com/avatar.jpg",
      bio: "Health enthusiast",
      organization: "Test Org",
      joinedDate: new Date("2024-01-01"),
      lastActive: new Date(),
    });
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    return new DashboardStats({
      checkinsThisWeek: 5,
      savedReflections: 12,
      activeGoals: 3,
      openSupportRequests: 2,
      openConversations: 1,
      queuedNotifications: 4,
      openPrivacyRequests: 0,
      totalAppointments: 10,
      completedAppointments: 8,
      pendingAppointments: 1,
      cancelledAppointments: 1,
    });
  }

  async updateMemberProfile(
    userId: string,
    updates: Partial<{ displayName: string; bio: string; avatar: string }>
  ): Promise<MemberProfile> {
    throw new Error("Not implemented");
  }

  async getRecentWellnessData(
    userId: string,
    limit?: number
  ): Promise<Array<{
    id: string;
    type: "mood" | "activity" | "goal";
    value: string | number;
    recordedAt: Date;
  }>> {
    return [
      {
        id: "wellness-1",
        type: "mood",
        value: "happy",
        recordedAt: new Date(),
      },
      {
        id: "wellness-2",
        type: "activity",
        value: 30,
        recordedAt: new Date(Date.now() - 86400000),
      },
    ];
  }
}

// ===== DOMAIN LAYER TESTS =====

describe("Domain Layer - MemberProfile Entity", () => {
  it("should create valid member profile", () => {
    const profile = new MemberProfile({
      id: "1",
      userId: "user-1",
      displayName: "Test User",
      email: "test@example.com",
      joinedDate: new Date(),
      lastActive: new Date(),
    });

    expect(profile.getId()).toBe("1");
    expect(profile.getDisplayName()).toBe("Test User");
  });

  it("should throw error for invalid email", () => {
    expect(() => {
      new MemberProfile({
        id: "1",
        userId: "user-1",
        displayName: "Test",
        email: "invalid-email",
        joinedDate: new Date(),
        lastActive: new Date(),
      });
    }).toThrow("valid email is required");
  });

  it("should throw error for missing displayName", () => {
    expect(() => {
      new MemberProfile({
        id: "1",
        userId: "user-1",
        displayName: "",
        email: "test@example.com",
        joinedDate: new Date(),
        lastActive: new Date(),
      });
    }).toThrow("displayName is required");
  });
});

describe("Domain Layer - DashboardStats Entity", () => {
  it("should create valid dashboard stats", () => {
    const stats = new DashboardStats({
      checkinsThisWeek: 5,
      savedReflections: 10,
      activeGoals: 3,
      openSupportRequests: 1,
      openConversations: 2,
      queuedNotifications: 0,
      openPrivacyRequests: 0,
      totalAppointments: 10,
      completedAppointments: 8,
      pendingAppointments: 1,
      cancelledAppointments: 1,
    });

    expect(stats.getCheckinsThisWeek()).toBe(5);
    expect(stats.getActiveGoals()).toBe(3);
  });

  it("should calculate appointment completion rate", () => {
    const stats = new DashboardStats({
      checkinsThisWeek: 0,
      savedReflections: 0,
      activeGoals: 0,
      openSupportRequests: 0,
      openConversations: 0,
      queuedNotifications: 0,
      openPrivacyRequests: 0,
      totalAppointments: 10,
      completedAppointments: 8,
      pendingAppointments: 1,
      cancelledAppointments: 1,
    });

    expect(stats.getAppointmentCompletionRate()).toBe(80);
  });

  it("should detect active engagement", () => {
    const activeStats = new DashboardStats({
      checkinsThisWeek: 5,
      savedReflections: 0,
      activeGoals: 0,
      openSupportRequests: 0,
      openConversations: 0,
      queuedNotifications: 0,
      openPrivacyRequests: 0,
      totalAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      cancelledAppointments: 0,
    });

    expect(activeStats.hasActiveEngagement()).toBe(true);
  });

  it("should throw error for negative values", () => {
    expect(() => {
      new DashboardStats({
        checkinsThisWeek: -1,
        savedReflections: 0,
        activeGoals: 0,
        openSupportRequests: 0,
        openConversations: 0,
        queuedNotifications: 0,
        openPrivacyRequests: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        cancelledAppointments: 0,
      });
    }).toThrow("cannot be negative");
  });
});

// ===== APPLICATION LAYER TESTS =====

describe("Application Layer - GetMemberProfileUseCase", () => {
  it("should fetch member profile successfully", async () => {
    const mockService = new MockMemberService();
    const useCase = new GetMemberProfileUseCase(mockService);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.getDisplayName()).toBe("John Doe");
  });

  it("should return error for empty userId", async () => {
    const mockService = new MockMemberService();
    const useCase = new GetMemberProfileUseCase(mockService);

    const result = await useCase.execute({ userId: "" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should handle service errors", async () => {
    const errorService: IMemberService = {
      getMemberProfile: () => Promise.reject(new Error("API Error")),
      getDashboardStats: () => Promise.reject(new Error("API Error")),
      updateMemberProfile: () => Promise.reject(new Error("API Error")),
      getRecentWellnessData: () => Promise.reject(new Error("API Error")),
    };

    const useCase = new GetMemberProfileUseCase(errorService);
    const result = await useCase.execute({ userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("API Error");
  });
});

describe("Application Layer - GetDashboardStatsUseCase", () => {
  it("should fetch dashboard stats successfully", async () => {
    const mockService = new MockMemberService();
    const useCase = new GetDashboardStatsUseCase(mockService);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.getCheckinsThisWeek()).toBe(5);
  });

  it("should return error for empty userId", async () => {
    const mockService = new MockMemberService();
    const useCase = new GetDashboardStatsUseCase(mockService);

    const result = await useCase.execute({ userId: "" });

    expect(result.success).toBe(false);
  });
});

// ===== INFRASTRUCTURE LAYER TESTS =====

describe("Infrastructure Layer - MemberRepository", () => {
  it("should instantiate with default base URL", () => {
    const repo = new MemberRepository();
    expect(repo).toBeDefined();
  });

  it("should set auth token", () => {
    const repo = new MemberRepository();
    expect(() => repo.setAuthToken("test-token")).not.toThrow();
  });
});

describe("Infrastructure Layer - MemberServiceImpl", () => {
  it("should throw error for empty userId", async () => {
    const mockRepo = new MemberRepository();
    const service = new MemberServiceImpl(mockRepo);

    await expect(service.getMemberProfile("")).rejects.toThrow(
      "userId is required"
    );
  });

  it("should validate limit parameter", async () => {
    const mockRepo = new MemberRepository();
    const service = new MemberServiceImpl(mockRepo);

    await expect(
      service.getRecentWellnessData("user-1", 0)
    ).rejects.toThrow("limit must be between 1 and 100");

    await expect(
      service.getRecentWellnessData("user-1", 101)
    ).rejects.toThrow("limit must be between 1 and 100");
  });
});

// ===== INTEGRATION TESTS =====

describe("Integration Tests - Full Flow", () => {
  it("should complete member profile fetch flow", async () => {
    const mockService = new MockMemberService();
    const useCase = new GetMemberProfileUseCase(mockService);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.success).toBe(true);
    expect(result.data?.getId()).toBe("member-1");
    expect(result.data?.getEmail()).toBe("john@example.com");
  });

  it("should complete dashboard stats fetch flow", async () => {
    const mockService = new MockMemberService();
    const useCase = new GetDashboardStatsUseCase(mockService);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.success).toBe(true);
    expect(result.data?.getCheckinsThisWeek()).toBe(5);
    expect(result.data?.getAppointmentCompletionRate()).toBe(80);
  });

  it("should handle multiple concurrent requests", async () => {
    const mockService = new MockMemberService();
    const profileUseCase = new GetMemberProfileUseCase(mockService);
    const statsUseCase = new GetDashboardStatsUseCase(mockService);

    const [profileResult, statsResult] = await Promise.all([
      profileUseCase.execute({ userId: "user-1" }),
      statsUseCase.execute({ userId: "user-1" }),
    ]);

    expect(profileResult.success).toBe(true);
    expect(statsResult.success).toBe(true);
    expect(profileResult.data?.getDisplayName()).toBe("John Doe");
    expect(statsResult.data?.getCheckinsThisWeek()).toBe(5);
  });
});

export default {};
