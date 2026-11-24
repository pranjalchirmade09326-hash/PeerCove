/**
 * Configuration: admin.config.ts
 * Environment-based configuration for the Admin module
 * Configuration layer - settings and feature flags
 */

// API Configuration
export const ADMIN_API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  endpoints: {
    getProfile: '/api/v1/admins/:adminId',
    updateProfile: '/api/v1/admins/:adminId',
    getStats: '/api/v1/admins/:adminId/stats',
    searchAdmins: '/api/v1/admins/search',
    checkPermission: '/api/v1/admins/:adminId/permissions/:permission',
    getDepartmentAdmins: '/api/v1/admins/department/:departmentId',
    getDepartmentStats: '/api/v1/departments/:departmentId/stats',
  },
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

// Refresh and Cache Configuration
export const ADMIN_CACHE_CONFIG = {
  profileTTL: 300000, // 5 minutes
  statsTTL: 60000, // 1 minute
  searchTTL: 180000, // 3 minutes
  autoRefreshInterval: 30000, // 30 seconds
};

// Role Permissions Mapping
export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  'super-admin': [
    'view-all-reports',
    'view-reports',
    'manage-users',
    'manage-admins',
    'manage-listeners',
    'configure-settings',
    'view-system-stats',
    'export-data',
    'manage-permissions',
  ],
  'moderator': [
    'view-reports',
    'manage-users',
    'manage-listeners',
    'moderate-content',
    'view-system-stats',
    'export-data',
  ],
  'analyst': [
    'view-reports',
    'view-system-stats',
    'export-data',
  ],
};

// Access Level Configuration
export const ACCESS_LEVEL_CONFIG: Record<number, string> = {
  1: 'Read Only',
  2: 'Limited Write',
  3: 'Standard Access',
  4: 'Extended Access',
  5: 'Full Access',
};

// Feature Flags
export const ADMIN_FEATURE_FLAGS = {
  enableAutoRefresh: process.env.NEXT_PUBLIC_ADMIN_AUTO_REFRESH !== 'false',
  enableAdvancedFiltering: process.env.NEXT_PUBLIC_ADMIN_ADVANCED_FILTERS !== 'false',
  enableExport: process.env.NEXT_PUBLIC_ADMIN_EXPORT !== 'false',
  enableBatchOperations: process.env.NEXT_PUBLIC_ADMIN_BATCH_OPS !== 'false',
  enableRealTimeStats: process.env.NEXT_PUBLIC_ADMIN_REALTIME !== 'false',
};

// UI Configuration
export const ADMIN_UI_CONFIG = {
  statsRefreshInterval: 30000,
  profileRefreshInterval: 300000,
  paginationPageSize: 20,
  maxSearchResults: 100,
  toastDuration: 3000,
  dialogAnimationDuration: 300,
};

// System Status Thresholds
export const ADMIN_THRESHOLDS = {
  warningPendingReports: 20,
  criticalPendingReports: 50,
  warningResponseTime: 300, // 5 minutes
  criticalResponseTime: 900, // 15 minutes
  warningEfficiency: 60,
  criticalEfficiency: 40,
};

// Department Configuration
export const DEPARTMENT_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  'dept-001': {
    name: 'Moderation',
    color: '#FF6B6B',
    icon: '🔍',
  },
  'dept-002': {
    name: 'Analytics',
    color: '#4ECDC4',
    icon: '📊',
  },
  'dept-003': {
    name: 'Operations',
    color: '#45B7D1',
    icon: '⚙️',
  },
  'dept-004': {
    name: 'Support',
    color: '#96CEB4',
    icon: '🤝',
  },
};

// Helper Functions
export function getPermissionsForRole(role: 'super-admin' | 'moderator' | 'analyst'): string[] {
  return ROLE_PERMISSIONS_MAP[role] || [];
}

export function getAccessLevelName(level: number): string {
  return ACCESS_LEVEL_CONFIG[level] || 'Unknown';
}

export function getDepartmentConfig(departmentId: string) {
  return DEPARTMENT_CONFIG[departmentId] || {
    name: departmentId,
    color: '#999999',
    icon: '📁',
  };
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getApiBaseUrl(): string {
  return ADMIN_API_CONFIG.baseUrl;
}

export function getRefreshInterval(): number {
  return ADMIN_CACHE_CONFIG.autoRefreshInterval;
}

export function isFeatureEnabled(feature: keyof typeof ADMIN_FEATURE_FLAGS): boolean {
  return ADMIN_FEATURE_FLAGS[feature];
}
