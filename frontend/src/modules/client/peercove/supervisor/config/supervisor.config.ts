/**
 * Configuration: Supervisor Module
 * Centralized configuration management for supervisor module
 */

export interface SupervisorConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  cache: {
    profileTTL: number;
    statsTTL: number;
  };
  features: {
    enableNotifications: boolean;
    enableExport: boolean;
    enableAnalytics: boolean;
  };
  ui: {
    pageSize: number;
    refreshInterval: number;
    theme: 'light' | 'dark';
  };
}

const getEnvironmentConfig = (): SupervisorConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  return {
    api: {
      baseUrl,
      timeout: isDevelopment ? 30000 : 15000,
      retries: 3,
    },
    cache: {
      profileTTL: 5 * 60 * 1000, // 5 minutes
      statsTTL: 2 * 60 * 1000, // 2 minutes
    },
    features: {
      enableNotifications: true,
      enableExport: true,
      enableAnalytics: !isDevelopment,
    },
    ui: {
      pageSize: 20,
      refreshInterval: isDevelopment ? 30000 : 60000, // 30s dev, 1m prod
      theme: (process.env.NEXT_PUBLIC_THEME as 'light' | 'dark') || 'light',
    },
  };
};

export const supervisorConfig = getEnvironmentConfig();

// Export configuration getter for dynamic updates
export const getSupervisorConfig = (): SupervisorConfig => {
  return getEnvironmentConfig();
};

// Export default configuration
export default supervisorConfig;
