/**
 * Infrastructure: SupervisorServiceImpl
 * Concrete implementation of ISupervisorService
 * Orchestrates repository and use cases
 */

import { SupervisorProfile } from '../../domain/entities/SupervisorProfile';
import { SupervisorStats } from '../../domain/entities/SupervisorStats';
import { ISupervisorService } from '../../domain/interfaces/ISupervisorService';
import { SupervisorRepository } from '../repositories/SupervisorRepository';
import { GetSupervisorProfileUseCase } from '../../application/usecases/GetSupervisorProfileUseCase';
import { GetSupervisorStatsUseCase } from '../../application/usecases/GetSupervisorStatsUseCase';

export class SupervisorServiceImpl implements ISupervisorService {
  private repository: SupervisorRepository;
  private _profileUseCase: GetSupervisorProfileUseCase;
  private _statsUseCase: GetSupervisorStatsUseCase;

  constructor(repository?: SupervisorRepository) {
    this.repository = repository || new SupervisorRepository();
    this._profileUseCase = new GetSupervisorProfileUseCase(this);
    this._statsUseCase = new GetSupervisorStatsUseCase(this);
  }

  setAuthToken(token: string): void {
    this.repository.setAuthToken(token);
  }

  async getSupervisorProfile(supervisorId: string): Promise<SupervisorProfile> {
    return this.repository.fetchSupervisorProfile(supervisorId);
  }

  async getSupervisorStats(supervisorId: string): Promise<SupervisorStats> {
    return this.repository.fetchSupervisorStats(supervisorId);
  }

  async searchSupervisors(criteria?: {
    department?: string;
    experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
    minRating?: number;
    maxTeamSize?: number;
  }): Promise<SupervisorProfile[]> {
    return this.repository.searchSupervisors(criteria);
  }

  async getTeamMembers(
    supervisorId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    return this.repository.fetchTeamMembers(supervisorId, limit, offset);
  }

  async updateSupervisorProfile(
    supervisorId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      department: string;
    }>
  ): Promise<SupervisorProfile> {
    return this.repository.updateSupervisorProfile(supervisorId, updates);
  }

  getProfileUseCase(): GetSupervisorProfileUseCase {
    return this._profileUseCase;
  }

  getStatsUseCase(): GetSupervisorStatsUseCase {
    return this._statsUseCase;
  }
}
