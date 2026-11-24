/**
 * Configuration: Safety Module Configuration
 * Centralized settings for the safety module
 * Supports environment-based overrides
 */

export const safetyConfig = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    endpoints: {
      getProfile: '/api/v1/safety/profiles/:id',
      getStats: '/api/v1/safety/stats/:id',
      search: '/api/v1/safety/profiles/search',
      highRisk: '/api/v1/safety/profiles/high-risk',
      critical: '/api/v1/safety/profiles/critical',
      alerts: '/api/v1/safety/alerts',
      assessments: '/api/v1/safety/assessments',
    },
    timeout: parseInt(process.env.SAFETY_API_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.SAFETY_API_RETRIES || '3', 10),
  },

  // Caching Configuration
  cache: {
    enabled: process.env.SAFETY_CACHE_ENABLED === 'true',
    duration: parseInt(process.env.SAFETY_CACHE_DURATION || '300000', 10), // 5 minutes
  },

  // Risk Thresholds
  riskThresholds: {
    low: { min: 0, max: 39 },
    medium: { min: 40, max: 59 },
    high: { min: 60, max: 79 },
    critical: { min: 80, max: 100 },
  },

  // Feature Flags
  features: {
    enablePolling: process.env.SAFETY_ENABLE_POLLING === 'true',
    enableWebsocket: process.env.SAFETY_ENABLE_WEBSOCKET === 'true',
    enableRealTimeStats: process.env.SAFETY_ENABLE_REALTIME_STATS === 'true',
    enableEscalation: process.env.SAFETY_ENABLE_ESCALATION !== 'false',
  },

  // Pagination
  pagination: {
    defaultLimit: parseInt(process.env.SAFETY_DEFAULT_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.SAFETY_MAX_LIMIT || '100', 10),
  },

  // Response Time Thresholds (minutes)
  responseTimeThresholds: {
    excellent: { max: 15 },
    good: { max: 30 },
    acceptable: { max: 60 },
    slow: { max: 120 },
    critical: { max: Infinity },
  },

  // UI Configuration
  ui: {
    showRiskScore: process.env.SAFETY_SHOW_RISK_SCORE !== 'false',
    showAlerts: process.env.SAFETY_SHOW_ALERTS !== 'false',
    showStats: process.env.SAFETY_SHOW_STATS !== 'false',
    showAssessmentHistory: process.env.SAFETY_SHOW_ASSESSMENT_HISTORY !== 'false',
    theme: process.env.SAFETY_THEME || 'light',
    refreshInterval: parseInt(process.env.SAFETY_REFRESH_INTERVAL || '30000', 10),
  },

  // Validation Rules
  validation: {
    minRiskScore: 0,
    maxRiskScore: 100,
    minResponseTime: 0,
    maxResponseTime: 1440, // 24 hours in minutes
    requireAssessmentEvery: 30, // days
  },

  // Alert Configuration
  alerts: {
    severityColors: {
      low: '#10B981', // Green
      medium: '#F59E0B', // Amber
      high: '#EF4444', // Red
      critical: '#991B1B', // Dark Red
    },
    autoEscalateAfter: 3, // hours
    maxAlertsDisplay: 50,
  },

  // Messages
  messages: {
    profileLoading: 'Loading safety profile...',
    profileError: 'Failed to load safety profile',
    statsLoading: 'Loading statistics...',
    statsError: 'Failed to load statistics',
    searchLoading: 'Searching profiles...',
    searchError: 'Failed to search profiles',
    noProfilesFound: 'No profiles found matching your criteria',
    noAlertsActive: 'No active alerts',
    networkError: 'Network error occurred. Please try again.',
    unauthorized: 'Your session has expired. Please log in again.',
    assessmentOverdue: 'Assessment is overdue for this profile',
    criticalRisk: 'This user is at critical risk and needs immediate attention',
  },
};

// Validation helpers
export function validateSafetyProfileEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRiskScore(score: number): boolean {
  return score >= 0 && score <= 100 && Number.isFinite(score);
}

export function validateResponseTime(minutes: number): boolean {
  return minutes >= 0 && minutes <= 1440 && Number.isInteger(minutes);
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getRiskColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#991B1B',
  };
  return colors[level] || '#6B7280';
}

export function getResponseTimeStatus(
  minutes: number
): 'excellent' | 'good' | 'acceptable' | 'slow' | 'critical' {
  if (minutes <= 15) return 'excellent';
  if (minutes <= 30) return 'good';
  if (minutes <= 60) return 'acceptable';
  if (minutes <= 120) return 'slow';
  return 'critical';
}

export function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
