/**
 * Domain Service Interface
 * Defines the contract for admin service operations
 * Decouples domain logic from infrastructure implementation
 */

import { AdminProfile } from '../entities/AdminProfile';
import { AdminStats } from '../entities/AdminStats';

export interface IAdminService {
  // Profile operations
  getAdminProfile(adminId: string): Promise<AdminProfile>;
  updateAdminProfile(
    adminId: string,
    updates: Partial<AdminProfile>
  ): Promise<AdminProfile>;
  searchAdmins(query: string, limit?: number): Promise<AdminProfile[]>;

  // Stats operations
  getAdminStats(adminId: string): Promise<AdminStats>;
  updateAdminStats(adminId: string, stats: Partial<AdminStats>): Promise<AdminStats>;

  // Permission checks
  checkPermission(adminId: string, permission: string): Promise<boolean>;
  validateAccess(adminId: string, resourceLevel: number): Promise<boolean>;

  // Department operations
  getAdminsByDepartment(departmentId: string): Promise<AdminProfile[]>;
  getDepartmentStats(departmentId: string): Promise<AdminStats>;
}
