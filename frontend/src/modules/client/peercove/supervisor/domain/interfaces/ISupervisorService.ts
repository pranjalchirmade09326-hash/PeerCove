/**
 * Domain Service Interface: ISupervisorService
 * Defines the contract for supervisor-related operations
 * Domain layer - pure business logic contracts
 */

import { SupervisorProfile } from '../entities/SupervisorProfile';
import { SupervisorStats } from '../entities/SupervisorStats';

export interface ISupervisorService {
  /**
   * Retrieve a supervisor's profile by ID
   */
  getSupervisorProfile(supervisorId: string): Promise<SupervisorProfile>;

  /**
   * Retrieve a supervisor's statistics
   */
  getSupervisorStats(supervisorId: string): Promise<SupervisorStats>;

  /**
   * Search supervisors by criteria
   */
  searchSupervisors(
    criteria?: {
      department?: string;
      experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
      minRating?: number;
      maxTeamSize?: number;
    }
  ): Promise<SupervisorProfile[]>;

  /**
   * Get all team members under a supervisor
   */
  getTeamMembers(
    supervisorId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]>;

  /**
   * Update supervisor profile
   */
  updateSupervisorProfile(
    supervisorId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      department: string;
    }>
  ): Promise<SupervisorProfile>;
}
