/**
 * Domain Interface: ISafetyService
 * Service interface for safety module operations
 * Domain layer - defines contracts independent of implementation
 */

import { SafetyProfile } from '../entities/SafetyProfile';
import { SafetyStats } from '../entities/SafetyStats';

export interface ISafetyService {
  // Profile operations
  getSafetyProfile(profileId: string): Promise<SafetyProfile>;
  searchSafetyProfiles(criteria: SearchCriteria): Promise<SafetyProfile[]>;
  getHighRiskProfiles(limit?: number): Promise<SafetyProfile[]>;
  getCriticalProfiles(limit?: number): Promise<SafetyProfile[]>;

  // Stats operations
  getSafetyStats(safetyId: string): Promise<SafetyStats>;
  getAggregatedStats(): Promise<SafetyStats>;

  // Alert operations
  getActiveAlerts(limit?: number): Promise<SafetyAlert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;
  escalateAlert(alertId: string): Promise<void>;

  // Assessment operations
  getRecentAssessments(limit?: number): Promise<Assessment[]>;
  updateAssessment(profileId: string, data: AssessmentData): Promise<void>;
}

export interface SearchCriteria {
  status?: 'low' | 'medium' | 'high' | 'critical';
  riskScoreMin?: number;
  riskScoreMax?: number;
  needsIntervention?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface SafetyAlert {
  id: string;
  profile_id: string;
  alert_type: 'warning' | 'urgent' | 'critical';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_acknowledged: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Assessment {
  id: string;
  profile_id: string;
  risk_score: number;
  notes: string;
  assessor_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface AssessmentData {
  risk_score: number;
  notes: string;
  status?: 'pending' | 'in_progress' | 'completed';
}
