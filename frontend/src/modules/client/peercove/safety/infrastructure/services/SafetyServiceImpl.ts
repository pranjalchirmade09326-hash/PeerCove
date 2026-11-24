/**
 * Infrastructure: SafetyServiceImpl
 * Concrete implementation of ISafetyService
 * Infrastructure layer - implements domain interfaces using repository
 */

import { SafetyRepository } from '../repositories/SafetyRepository';
import { SafetyProfile } from '../../domain/entities/SafetyProfile';
import { SafetyStats } from '../../domain/entities/SafetyStats';
import {
  ISafetyService,
  SearchCriteria,
  SafetyAlert,
  Assessment,
  AssessmentData,
} from '../../domain/interfaces/ISafetyService';

export class SafetyServiceImpl implements ISafetyService {
  private repository: SafetyRepository;

  constructor(repository: SafetyRepository) {
    this.repository = repository;
  }

  async getSafetyProfile(profileId: string): Promise<SafetyProfile> {
    return this.repository.fetchSafetyProfile(profileId);
  }

  async searchSafetyProfiles(criteria: SearchCriteria): Promise<SafetyProfile[]> {
    return this.repository.searchProfiles(criteria);
  }

  async getHighRiskProfiles(limit: number = 20): Promise<SafetyProfile[]> {
    return this.repository.getHighRiskProfiles(limit);
  }

  async getCriticalProfiles(limit: number = 20): Promise<SafetyProfile[]> {
    return this.repository.getCriticalProfiles(limit);
  }

  async getSafetyStats(safetyId: string): Promise<SafetyStats> {
    return this.repository.fetchSafetyStats(safetyId);
  }

  async getAggregatedStats(): Promise<SafetyStats> {
    return this.repository.getAggregatedStats();
  }

  async getActiveAlerts(limit: number = 50): Promise<SafetyAlert[]> {
    return this.repository.getActiveAlerts(limit);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    return this.repository.acknowledgeAlert(alertId);
  }

  async escalateAlert(alertId: string): Promise<void> {
    return this.repository.escalateAlert(alertId);
  }

  async getRecentAssessments(limit: number = 20): Promise<Assessment[]> {
    return this.repository.getRecentAssessments(limit);
  }

  async updateAssessment(profileId: string, data: AssessmentData): Promise<void> {
    return this.repository.updateAssessment(profileId, data);
  }
}
