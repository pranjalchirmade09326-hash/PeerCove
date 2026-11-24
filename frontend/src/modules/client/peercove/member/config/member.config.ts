/**
 * Member Module Configuration
 *
 * Centralized configuration for the member module including:
 * - API base URLs (dev/prod)
 * - Feature flags
 * - Timeouts and retry policies
 * - Cache settings
 *
 * Layer: Configuration
 */

export const MEMBER_CONFIG = {
  // API Configuration
  api: {
    // Base URL for member service APIs
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",

    // Endpoints
    endpoints: {
      profile: (userId: string) => `/members/${userId}`,
      dashboard: (userId: string) => `/members/${userId}/dashboard`,
      wellness: (userId: string, limit?: number) => {
        const base = `/members/${userId}/wellness`;
        return limit ? `${base}?limit=${limit}` : base;
      },
      appointments: (userId: string) => `/members/${userId}/appointments`,
      updateProfile: (userId: string) => `/members/${userId}`,
    },

    // Request configuration
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
    retryAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || "3"),
    retryDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || "1000"),
  },

  // Authentication Configuration
  auth: {
    // Header for JWT token
    tokenHeader: "Authorization",
    tokenPrefix: "Bearer",
    
    // Token storage key in localStorage
    storageKey: "member_auth_token",
  },

  // Feature Flags
  features: {
    // Enable real-time dashboard updates via polling
    enablePolling: process.env.NEXT_PUBLIC_ENABLE_POLLING === "true",
    pollingInterval: parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "30000"), // 30 seconds

    // Enable caching of profile and stats
    enableCaching: process.env.NEXT_PUBLIC_ENABLE_CACHING !== "false",
    cacheDuration: parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION || "300000"), // 5 minutes

    // Enable error telemetry
    enableTelemetry: process.env.NEXT_PUBLIC_ENABLE_TELEMETRY !== "false",

    // Enable skeleton loading animations
    enableSkeletonAnimation: process.env.NEXT_PUBLIC_ENABLE_SKELETON !== "false",
  },

  // Validation Rules
  validation: {
    // Email validation pattern
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Min/max constraints
    displayNameMinLength: 2,
    displayNameMaxLength: 100,
    bioMaxLength: 500,
    bioMinLength: 0,

    // Wellness data limits
    wellnessDataMinLimit: 1,
    wellnessDataMaxLimit: 100,
    wellnessDataDefaultLimit: 20,
  },

  // UI Configuration
  ui: {
    // Breakpoints for responsive design
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      "2xl": 1536,
    },

    // Animation durations (ms)
    animations: {
      fast: 150,
      normal: 300,
      slow: 500,
    },

    // Skeleton loading count
    skeletonCount: 5,
  },

  // Error Messages
  messages: {
    errors: {
      networkError: "Unable to connect to the server. Please check your connection.",
      authError: "Your session has expired. Please sign in again.",
      notFound: "The requested resource was not found.",
      serverError: "A server error occurred. Please try again later.",
      invalidInput: "The provided input is invalid.",
      timeout: "Request timed out. Please try again.",
    },
    success: {
      profileUpdated: "Profile updated successfully!",
      profileFetched: "Profile loaded successfully.",
      statsFetched: "Dashboard statistics loaded.",
    },
  },

  // Logging Configuration
  logging: {
    // Enable debug logging
    enableDebug: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",

    // Log levels: error, warn, info, debug
    level: process.env.NEXT_PUBLIC_LOG_LEVEL || "warn",
  },
};

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${MEMBER_CONFIG.api.baseUrl}${endpoint}`;
}

/**
 * Get auth header for API requests
 */
export function getAuthHeader(token?: string): Record<string, string> {
  if (!token) return {};

  return {
    [MEMBER_CONFIG.auth.tokenHeader]: `${MEMBER_CONFIG.auth.tokenPrefix} ${token}`,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return MEMBER_CONFIG.validation.emailPattern.test(email);
}

/**
 * Validate display name
 */
export function validateDisplayName(name: string): string | null {
  if (name.length < MEMBER_CONFIG.validation.displayNameMinLength) {
    return `Display name must be at least ${MEMBER_CONFIG.validation.displayNameMinLength} characters`;
  }
  if (name.length > MEMBER_CONFIG.validation.displayNameMaxLength) {
    return `Display name must not exceed ${MEMBER_CONFIG.validation.displayNameMaxLength} characters`;
  }
  return null;
}

/**
 * Validate wellness data limit
 */
export function validateWellnessLimit(limit: number): string | null {
  if (limit < MEMBER_CONFIG.validation.wellnessDataMinLimit) {
    return `Limit must be at least ${MEMBER_CONFIG.validation.wellnessDataMinLimit}`;
  }
  if (limit > MEMBER_CONFIG.validation.wellnessDataMaxLimit) {
    return `Limit must not exceed ${MEMBER_CONFIG.validation.wellnessDataMaxLimit}`;
  }
  return null;
}

/**
 * Get error message by error code
 */
export function getErrorMessage(errorKey: keyof typeof MEMBER_CONFIG.messages.errors): string {
  return MEMBER_CONFIG.messages.errors[errorKey] || MEMBER_CONFIG.messages.errors.serverError;
}

export default MEMBER_CONFIG;
