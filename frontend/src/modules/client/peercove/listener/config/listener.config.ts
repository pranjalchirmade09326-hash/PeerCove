/**
 * Configuration: Listener Module Configuration
 * Centralized settings for the listener module
 * Supports environment-based overrides
 */

export const listenerConfig = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    endpoints: {
      getProfile: '/api/v1/listeners/:id',
      getStats: '/api/v1/listeners/:id/stats',
      search: '/api/v1/listeners/search',
      available: '/api/v1/listeners/available',
      checkAvailability: '/api/v1/listeners/:id/availability',
    },
    timeout: parseInt(process.env.LISTENER_API_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.LISTENER_API_RETRIES || '3', 10),
  },

  // Caching Configuration
  cache: {
    enabled: process.env.LISTENER_CACHE_ENABLED === 'true',
    duration: parseInt(process.env.LISTENER_CACHE_DURATION || '300000', 10), // 5 minutes
  },

  // Feature Flags
  features: {
    enablePolling: process.env.LISTENER_ENABLE_POLLING === 'true',
    enableWebsocket: process.env.LISTENER_ENABLE_WEBSOCKET === 'true',
    enableRealTimeStats: process.env.LISTENER_ENABLE_REALTIME_STATS === 'true',
  },

  // Pagination
  pagination: {
    defaultLimit: parseInt(process.env.LISTENER_DEFAULT_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.LISTENER_MAX_LIMIT || '100', 10),
  },

  // UI Configuration
  ui: {
    showRating: process.env.LISTENER_SHOW_RATING !== 'false',
    showAvailability: process.env.LISTENER_SHOW_AVAILABILITY !== 'false',
    showStats: process.env.LISTENER_SHOW_STATS !== 'false',
    theme: process.env.LISTENER_THEME || 'light',
  },

  // Validation Rules
  validation: {
    minExperience: parseInt(process.env.LISTENER_MIN_EXPERIENCE || '0', 10),
    minRating: parseFloat(process.env.LISTENER_MIN_RATING || '3.5'),
    requireVerification: process.env.LISTENER_REQUIRE_VERIFICATION !== 'false',
  },

  // Messages
  messages: {
    profileLoading: 'Loading listener profile...',
    profileError: 'Failed to load listener profile',
    statsLoading: 'Loading statistics...',
    statsError: 'Failed to load statistics',
    searchLoading: 'Searching listeners...',
    searchError: 'Failed to search listeners',
    noListenersFound: 'No listeners found matching your criteria',
    networkError: 'Network error occurred. Please try again.',
    unauthorized: 'Your session has expired. Please log in again.',
  },
};

// Validation helpers
export function validateListenerEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateLicenseNumber(licenseNumber: string): boolean {
  return licenseNumber.length >= 5 && licenseNumber.length <= 20;
}

export function validateSpecializations(specializations: string[]): boolean {
  return specializations.length > 0 && specializations.every((s) => s.trim().length > 0);
}

export function validateYearsOfExperience(years: number): boolean {
  return years >= 0 && years <= 70 && Number.isInteger(years);
}
