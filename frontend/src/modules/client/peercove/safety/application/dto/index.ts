/**
 * Application Layer: DTOs and Result Type
 * Data transfer objects and Result<T> pattern for consistent responses
 * Application layer - standardizes data flowing through use cases
 */

// Result<T> pattern for consistent error handling
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    timestamp: string;
    duration: number;
  };
}

// GetSafetyProfileUseCase DTOs
export interface GetSafetyProfileInput {
  profileId: string;
}

export interface GetSafetyProfileOutput {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  risk_score: number;
  status: 'low' | 'medium' | 'high' | 'critical';
  last_assessment_date: string;
  needs_intervention: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GetSafetyStatsUseCase DTOs
export interface GetSafetyStatsInput {
  safetyId: string;
}

export interface GetSafetyStatsOutput {
  safety_id: string;
  high_risk_users: number;
  alerts_active: number;
  incidents_reported: number;
  avg_response_time_minutes: number;
  escalations_made: number;
  assessment_completion_rate: number;
  critical_cases: number;
  health_score: number;
  system_status: 'healthy' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
}

// Search profiles DTO
export interface SearchSafetyProfilesInput {
  status?: 'low' | 'medium' | 'high' | 'critical';
  riskScoreMin?: number;
  riskScoreMax?: number;
  needsIntervention?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchSafetyProfilesOutput {
  profiles: GetSafetyProfileOutput[];
  total: number;
  limit: number;
  offset: number;
}

// Get alerts DTO
export interface GetAlertsInput {
  limit?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SafetyAlertDTO {
  id: string;
  profile_id: string;
  alert_type: 'warning' | 'urgent' | 'critical';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetAlertsOutput {
  alerts: SafetyAlertDTO[];
  total: number;
}

// Assessment DTO
export interface Assessment {
  id: string;
  profile_id: string;
  risk_score: number;
  notes: string;
  assessor_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface GetAssessmentsOutput {
  assessments: Assessment[];
  total: number;
}
