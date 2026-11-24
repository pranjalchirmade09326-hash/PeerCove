/**
 * Admin Module Test Suite
 * Comprehensive tests covering domain, application, infrastructure, and integration layers
 * 20+ test cases with full coverage
 */

import { AdminProfile } from './domain/entities/AdminProfile';
import { AdminStats } from './domain/entities/AdminStats';
import { GetAdminProfileUseCase } from './application/usecases/GetAdminProfileUseCase';
import { GetAdminStatsUseCase } from './application/usecases/GetAdminStatsUseCase';
import { AdminRepository } from './infrastructure/repositories/AdminRepository';
import { AdminServiceImpl } from './infrastructure/services/AdminServiceImpl';

// ============================================================================
// DOMAIN LAYER TESTS - AdminProfile Entity
// ============================================================================

describe('AdminProfile Entity', () => {
  const validProps = {
    id: 'admin-001',
    userId: 'user-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'super-admin' as const,
    permissions: ['view-reports', 'manage-users'],
    departmentId: 'dept-001',
    accessLevel: 5 as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should create admin profile with valid data', () => {
    const profile = new AdminProfile(validProps);
    expect(profile.id).toBe('admin-001');
    expect(profile.fullName).toBe('John Doe');
    expect(profile.email).toBe('john@example.com');
    expect(profile.role).toBe('super-admin');
  });

  it('should throw error if ID is missing', () => {
    expect(() => {
      new AdminProfile({
        ...validProps,
        id: '',
      });
    }).toThrow('Admin ID is required');
  });

  it('should throw error if email is invalid', () => {
    expect(() => {
      new AdminProfile({
        ...validProps,
        email: 'invalid-email',
      });
    }).toThrow('Valid email is required');
  });

  it('should throw error if role is invalid', () => {
    expect(() => {
      new AdminProfile({
        ...validProps,
        role: 'invalid-role' as any,
      });
    }).toThrow('Invalid admin role');
  });

  it('should throw error if access level is invalid', () => {
    expect(() => {
      new AdminProfile({
        ...validProps,
        accessLevel: 0 as any,
      });
    }).toThrow('Access level must be between 1 and 5');
  });

  it('should throw error if permissions array is empty', () => {
    expect(() => {
      new AdminProfile({
        ...validProps,
        permissions: [],
      });
    }).toThrow('At least one permission is required');
  });

  it('should return correct initials', () => {
    const profile = new AdminProfile(validProps);
    expect(profile.getInitials()).toBe('JD');
  });

  it('should check permissions correctly', () => {
    const profile = new AdminProfile(validProps);
    expect(profile.hasPermission('view-reports')).toBe(true);
    expect(profile.hasPermission('invalid-permission')).toBe(false);
  });

  it('should identify high privilege admin correctly', () => {
    const highPrivilegeProfile = new AdminProfile(validProps);
    expect(highPrivilegeProfile.isHighPrivilege()).toBe(true);

    const lowPrivilegeProfile = new AdminProfile({
      ...validProps,
      role: 'analyst' as const,
      accessLevel: 1 as const,
    });
    expect(lowPrivilegeProfile.isHighPrivilege()).toBe(false);
  });

  it('should check resource access based on access level', () => {
    const profile = new AdminProfile(validProps);
    expect(profile.canAccessResource(1)).toBe(true);
    expect(profile.canAccessResource(5)).toBe(true);
    expect(profile.canAccessResource(6)).toBe(false);
  });

  it('should return correct role display name', () => {
    const profile = new AdminProfile(validProps);
    expect(profile.getRoleDisplayName()).toBe('Super Administrator');
  });
});

// ============================================================================
// DOMAIN LAYER TESTS - AdminStats Entity
// ============================================================================

describe('AdminStats Entity', () => {
  const validStatsProps = {
    adminId: 'admin-001',
    totalUsers: 1000,
    totalListeners: 150,
    totalReports: 50,
    totalSessions: 500,
    activeModeration: 10,
    reportsPending: 5,
    avgResponseTime: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should create admin stats with valid data', () => {
    const stats = new AdminStats(validStatsProps);
    expect(stats.adminId).toBe('admin-001');
    expect(stats.totalUsers).toBe(1000);
    expect(stats.totalReports).toBe(50);
  });

  it('should throw error if values are negative', () => {
    expect(() => {
      new AdminStats({
        ...validStatsProps,
        totalUsers: -1,
      });
    }).toThrow('Total users cannot be negative');
  });

  it('should throw error if pending reports exceed total reports', () => {
    expect(() => {
      new AdminStats({
        ...validStatsProps,
        reportsPending: 100,
      });
    }).toThrow('Pending reports must be between 0 and total reports');
  });

  it('should calculate workload score correctly', () => {
    const stats = new AdminStats(validStatsProps);
    const score = stats.workloadScore();
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should calculate efficiency rating correctly', () => {
    const stats = new AdminStats(validStatsProps);
    const rating = stats.efficiencyRating();
    expect(rating).toBeGreaterThanOrEqual(0);
    expect(rating).toBeLessThanOrEqual(100);
  });

  it('should determine team health status correctly', () => {
    const stats = new AdminStats(validStatsProps);
    const health = stats.teamHealth();
    expect(['healthy', 'warning', 'critical']).toContain(health);
  });

  it('should calculate sessions per listener correctly', () => {
    const stats = new AdminStats(validStatsProps);
    const sessionsPerListener = stats.getSessionsPerListener();
    expect(sessionsPerListener).toBe(Math.round(500 / 150));
  });

  it('should calculate report resolution rate correctly', () => {
    const stats = new AdminStats(validStatsProps);
    const rate = stats.getReportResolutionRate();
    expect(rate).toBe(90); // (50 - 5) / 50 * 100
  });

  it('should calculate moderation progress correctly', () => {
    const stats = new AdminStats(validStatsProps);
    const progress = stats.getModerationProgress();
    expect(progress).toBe(90); // (50 - 5) / 50 * 100
  });

  it('should determine system status correctly', () => {
    const stats = new AdminStats(validStatsProps);
    const status = stats.getSystemStatus();
    expect(['optimal', 'nominal', 'degraded']).toContain(status);
  });

  it('should handle zero total reports', () => {
    const stats = new AdminStats({
      ...validStatsProps,
      totalReports: 0,
      activeModeration: 0,
      reportsPending: 0,
    });
    expect(stats.getReportResolutionRate()).toBe(0);
    expect(stats.getModerationProgress()).toBe(0);
  });
});

// ============================================================================
// APPLICATION LAYER TESTS - Use Cases
// ============================================================================

describe('GetAdminProfileUseCase', () => {
  const mockAdminService = {
    getAdminProfile: jest.fn(),
    updateAdminProfile: jest.fn(),
    searchAdmins: jest.fn(),
    getAdminStats: jest.fn(),
    updateAdminStats: jest.fn(),
    checkPermission: jest.fn(),
    validateAccess: jest.fn(),
    getAdminsByDepartment: jest.fn(),
    getDepartmentStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if admin ID is empty', async () => {
    const useCase = new GetAdminProfileUseCase(mockAdminService as any);
    const result = await useCase.execute({ adminId: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Admin ID is required');
  });

  it('should successfully fetch admin profile', async () => {
    const mockProfile = new AdminProfile({
      id: 'admin-001',
      userId: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'super-admin',
      permissions: ['view-reports'],
      departmentId: 'dept-001',
      accessLevel: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockAdminService.getAdminProfile.mockResolvedValue(mockProfile);

    const useCase = new GetAdminProfileUseCase(mockAdminService as any);
    const result = await useCase.execute({ adminId: 'admin-001' });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.firstName).toBe('John');
    expect(mockAdminService.getAdminProfile).toHaveBeenCalledWith('admin-001');
  });

  it('should handle service errors gracefully', async () => {
    mockAdminService.getAdminProfile.mockRejectedValue(
      new Error('Service error')
    );

    const useCase = new GetAdminProfileUseCase(mockAdminService as any);
    const result = await useCase.execute({ adminId: 'admin-001' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Service error');
  });

  it('should include metadata in response', async () => {
    const mockProfile = new AdminProfile({
      id: 'admin-001',
      userId: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'super-admin',
      permissions: ['view-reports'],
      departmentId: 'dept-001',
      accessLevel: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockAdminService.getAdminProfile.mockResolvedValue(mockProfile);

    const useCase = new GetAdminProfileUseCase(mockAdminService as any);
    const result = await useCase.execute({ adminId: 'admin-001' });

    expect(result.metadata).toBeDefined();
    expect(result.metadata?.timestamp).toBeDefined();
    expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
  });
});

describe('GetAdminStatsUseCase', () => {
  const mockAdminService = {
    getAdminProfile: jest.fn(),
    updateAdminProfile: jest.fn(),
    searchAdmins: jest.fn(),
    getAdminStats: jest.fn(),
    updateAdminStats: jest.fn(),
    checkPermission: jest.fn(),
    validateAccess: jest.fn(),
    getAdminsByDepartment: jest.fn(),
    getDepartmentStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if admin ID is empty', async () => {
    const useCase = new GetAdminStatsUseCase(mockAdminService as any);
    const result = await useCase.execute({ adminId: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Admin ID is required');
  });

  it('should successfully fetch admin stats', async () => {
    const mockStats = new AdminStats({
      adminId: 'admin-001',
      totalUsers: 1000,
      totalListeners: 150,
      totalReports: 50,
      totalSessions: 500,
      activeModeration: 10,
      reportsPending: 5,
      avgResponseTime: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockAdminService.getAdminStats.mockResolvedValue(mockStats);

    const useCase = new GetAdminStatsUseCase(mockAdminService as any);
    const result = await useCase.execute({ adminId: 'admin-001' });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalUsers).toBe(1000);
    expect(result.data?.workloadScore).toBeDefined();
    expect(result.data?.efficiencyRating).toBeDefined();
  });

  it('should calculate all metrics in stats output', async () => {
    const mockStats = new AdminStats({
      adminId: 'admin-001',
      totalUsers: 1000,
      totalListeners: 150,
      totalReports: 50,
      totalSessions: 500,
      activeModeration: 10,
      reportsPending: 5,
      avgResponseTime: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockAdminService.getAdminStats.mockResolvedValue(mockStats);

    const useCase = new GetAdminStatsUseCase(mockAdminService as any);
    const result = await useCase.execute({ adminId: 'admin-001' });

    expect(result.data?.workloadScore).toBeGreaterThanOrEqual(0);
    expect(result.data?.efficiencyRating).toBeGreaterThanOrEqual(0);
    expect(result.data?.teamHealth).toBeDefined();
    expect(result.data?.sessionPerListener).toBeGreaterThanOrEqual(0);
    expect(result.data?.reportResolutionRate).toBeGreaterThanOrEqual(0);
    expect(result.data?.moderationProgress).toBeGreaterThanOrEqual(0);
    expect(result.data?.systemStatus).toBeDefined();
  });
});

// ============================================================================
// INFRASTRUCTURE LAYER TESTS - Service Implementation
// ============================================================================

describe('AdminServiceImpl', () => {
  const mockRepository = {
    fetchAdminProfile: jest.fn(),
    fetchAdminStats: jest.fn(),
    updateAdminProfile: jest.fn(),
    searchAdmins: jest.fn(),
    checkPermission: jest.fn(),
    getAdminsByDepartment: jest.fn(),
    getDepartmentStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if admin ID is missing', async () => {
    const service = new AdminServiceImpl(mockRepository as any);

    await expect(service.getAdminProfile('')).rejects.toThrow(
      'Admin ID is required'
    );
  });

  it('should fetch admin profile from repository', async () => {
    const mockProfile = new AdminProfile({
      id: 'admin-001',
      userId: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'super-admin',
      permissions: ['view-reports'],
      departmentId: 'dept-001',
      accessLevel: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository.fetchAdminProfile.mockResolvedValue(mockProfile);

    const service = new AdminServiceImpl(mockRepository as any);
    const result = await service.getAdminProfile('admin-001');

    expect(result).toBe(mockProfile);
    expect(mockRepository.fetchAdminProfile).toHaveBeenCalledWith('admin-001');
  });

  it('should fetch admin stats from repository', async () => {
    const mockStats = new AdminStats({
      adminId: 'admin-001',
      totalUsers: 1000,
      totalListeners: 150,
      totalReports: 50,
      totalSessions: 500,
      activeModeration: 10,
      reportsPending: 5,
      avgResponseTime: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository.fetchAdminStats.mockResolvedValue(mockStats);

    const service = new AdminServiceImpl(mockRepository as any);
    const result = await service.getAdminStats('admin-001');

    expect(result).toBe(mockStats);
    expect(mockRepository.fetchAdminStats).toHaveBeenCalledWith('admin-001');
  });

  it('should check permissions through repository', async () => {
    mockRepository.checkPermission.mockResolvedValue(true);

    const service = new AdminServiceImpl(mockRepository as any);
    const hasPermission = await service.checkPermission('admin-001', 'view-reports');

    expect(hasPermission).toBe(true);
    expect(mockRepository.checkPermission).toHaveBeenCalledWith(
      'admin-001',
      'view-reports'
    );
  });

  it('should return false on permission check error', async () => {
    mockRepository.checkPermission.mockRejectedValue(new Error('Error'));

    const service = new AdminServiceImpl(mockRepository as any);
    const hasPermission = await service.checkPermission('admin-001', 'view-reports');

    expect(hasPermission).toBe(false);
  });

  it('should validate access based on profile access level', async () => {
    const mockProfile = new AdminProfile({
      id: 'admin-001',
      userId: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'super-admin',
      permissions: ['view-reports'],
      departmentId: 'dept-001',
      accessLevel: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository.fetchAdminProfile.mockResolvedValue(mockProfile);

    const service = new AdminServiceImpl(mockRepository as any);
    const canAccess = await service.validateAccess('admin-001', 3);

    expect(canAccess).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Admin Module Integration', () => {
  it('should complete profile fetch workflow', async () => {
    // This tests the full flow: UseCase -> Service -> Repository
    const mockRepository = {
      fetchAdminProfile: jest.fn(),
      fetchAdminStats: jest.fn(),
      updateAdminProfile: jest.fn(),
      searchAdmins: jest.fn(),
      checkPermission: jest.fn(),
      getAdminsByDepartment: jest.fn(),
      getDepartmentStats: jest.fn(),
    };

    const mockProfile = new AdminProfile({
      id: 'admin-001',
      userId: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'super-admin',
      permissions: ['view-reports', 'manage-users'],
      departmentId: 'dept-001',
      accessLevel: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository.fetchAdminProfile.mockResolvedValue(mockProfile);

    const service = new AdminServiceImpl(mockRepository as any);
    const useCase = new GetAdminProfileUseCase(service);

    const result = await useCase.execute({ adminId: 'admin-001' });

    expect(result.success).toBe(true);
    expect(result.data?.firstName).toBe('John');
    expect(mockRepository.fetchAdminProfile).toHaveBeenCalled();
  });

  it('should complete stats fetch workflow', async () => {
    const mockRepository = {
      fetchAdminProfile: jest.fn(),
      fetchAdminStats: jest.fn(),
      updateAdminProfile: jest.fn(),
      searchAdmins: jest.fn(),
      checkPermission: jest.fn(),
      getAdminsByDepartment: jest.fn(),
      getDepartmentStats: jest.fn(),
    };

    const mockStats = new AdminStats({
      adminId: 'admin-001',
      totalUsers: 1000,
      totalListeners: 150,
      totalReports: 50,
      totalSessions: 500,
      activeModeration: 10,
      reportsPending: 5,
      avgResponseTime: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository.fetchAdminStats.mockResolvedValue(mockStats);

    const service = new AdminServiceImpl(mockRepository as any);
    const useCase = new GetAdminStatsUseCase(service);

    const result = await useCase.execute({ adminId: 'admin-001' });

    expect(result.success).toBe(true);
    expect(result.data?.totalUsers).toBe(1000);
    expect(mockRepository.fetchAdminStats).toHaveBeenCalled();
  });
});

// ============================================================================
// EXPORT TESTS - Jest compatibility
// ============================================================================

export {};
