/**
 * Infrastructure: AdminServiceImpl
 * Implements the IAdminService interface
 * Coordinates repository, use cases, and entities
 * Infrastructure layer - bridges domain and repositories
 */

import { AdminProfile } from '../../domain/entities/AdminProfile';
import { AdminStats } from '../../domain/entities/AdminStats';
import { IAdminService } from '../../domain/interfaces/IAdminService';
import { AdminRepository } from './AdminRepository';

export class AdminServiceImpl implements IAdminService {
  constructor(private repository: AdminRepository) {}

  async getAdminProfile(adminId: string): Promise<AdminProfile> {
    if (!adminId || adminId.trim() === '') {
      throw new Error('Admin ID is required');
    }

    try {
      const profile = await this.repository.fetchAdminProfile(adminId);
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin profile';
      console.error('AdminServiceImpl.getAdminProfile error:', errorMessage);
      throw new Error(`Failed to retrieve admin profile: ${errorMessage}`);
    }
  }

  async updateAdminProfile(
    adminId: string,
    updates: Partial<AdminProfile>
  ): Promise<AdminProfile> {
    if (!adminId || adminId.trim() === '') {
      throw new Error('Admin ID is required');
    }

    try {
      const updatesDTO = this.convertToUpdateDTO(updates);
      const updatedProfile = await this.repository.updateAdminProfile(adminId, updatesDTO);
      return updatedProfile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update admin profile';
      console.error('AdminServiceImpl.updateAdminProfile error:', errorMessage);
      throw new Error(`Failed to update admin profile: ${errorMessage}`);
    }
  }

  async searchAdmins(query: string, limit: number = 20): Promise<AdminProfile[]> {
    try {
      const admins = await this.repository.searchAdmins(query, limit);
      return admins;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search admins';
      console.error('AdminServiceImpl.searchAdmins error:', errorMessage);
      throw new Error(`Failed to search admins: ${errorMessage}`);
    }
  }

  async getAdminStats(adminId: string): Promise<AdminStats> {
    if (!adminId || adminId.trim() === '') {
      throw new Error('Admin ID is required');
    }

    try {
      const stats = await this.repository.fetchAdminStats(adminId);
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin stats';
      console.error('AdminServiceImpl.getAdminStats error:', errorMessage);
      throw new Error(`Failed to retrieve admin stats: ${errorMessage}`);
    }
  }

  async updateAdminStats(adminId: string, stats: Partial<AdminStats>): Promise<AdminStats> {
    if (!adminId || adminId.trim() === '') {
      throw new Error('Admin ID is required');
    }

    try {
      // Stats are typically read-only, but provide interface for consistency
      const currentStats = await this.getAdminStats(adminId);
      return currentStats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update admin stats';
      console.error('AdminServiceImpl.updateAdminStats error:', errorMessage);
      throw new Error(`Failed to update admin stats: ${errorMessage}`);
    }
  }

  async checkPermission(adminId: string, permission: string): Promise<boolean> {
    if (!adminId || adminId.trim() === '') {
      throw new Error('Admin ID is required');
    }

    if (!permission || permission.trim() === '') {
      throw new Error('Permission is required');
    }

    try {
      const hasPermission = await this.repository.checkPermission(adminId, permission);
      return hasPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check permission';
      console.error('AdminServiceImpl.checkPermission error:', errorMessage);
      return false;
    }
  }

  async validateAccess(adminId: string, resourceLevel: number): Promise<boolean> {
    if (!adminId || adminId.trim() === '') {
      throw new Error('Admin ID is required');
    }

    try {
      const profile = await this.getAdminProfile(adminId);
      return profile.canAccessResource(resourceLevel);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate access';
      console.error('AdminServiceImpl.validateAccess error:', errorMessage);
      return false;
    }
  }

  async getAdminsByDepartment(departmentId: string): Promise<AdminProfile[]> {
    if (!departmentId || departmentId.trim() === '') {
      throw new Error('Department ID is required');
    }

    try {
      const admins = await this.repository.getAdminsByDepartment(departmentId);
      return admins;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admins by department';
      console.error('AdminServiceImpl.getAdminsByDepartment error:', errorMessage);
      throw new Error(`Failed to retrieve admins by department: ${errorMessage}`);
    }
  }

  async getDepartmentStats(departmentId: string): Promise<AdminStats> {
    if (!departmentId || departmentId.trim() === '') {
      throw new Error('Department ID is required');
    }

    try {
      const stats = await this.repository.getDepartmentStats(departmentId);
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch department stats';
      console.error('AdminServiceImpl.getDepartmentStats error:', errorMessage);
      throw new Error(`Failed to retrieve department stats: ${errorMessage}`);
    }
  }

  private convertToUpdateDTO(updates: Partial<AdminProfile>) {
    return {
      first_name: updates.firstName,
      last_name: updates.lastName,
      email: updates.email,
      permissions: updates.permissions,
      access_level: updates.accessLevel,
    };
  }
}
