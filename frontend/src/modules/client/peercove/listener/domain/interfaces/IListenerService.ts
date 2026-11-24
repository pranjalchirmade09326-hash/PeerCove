/**
 * Domain Service Interface
 * Defines the contract for listener service operations
 * Decouples domain logic from infrastructure implementation
 */

import { ListenerProfile } from './ListenerProfile';
import { ListenerStats } from './ListenerStats';

export interface IListenerService {
  // Profile operations
  getListenerProfile(listenerId: string): Promise<ListenerProfile>;
  updateListenerProfile(listenerId: string, updates: Partial<ListenerProfile>): Promise<ListenerProfile>;
  validateListenerLicense(licenseNumber: string): Promise<boolean>;

  // Stats operations
  getListenerStats(listenerId: string): Promise<ListenerStats>;
  updateListenerStats(listenerId: string, stats: Partial<ListenerStats>): Promise<ListenerStats>;

  // Search and filter
  searchListenersBySpecialization(specialization: string, limit?: number): Promise<ListenerProfile[]>;
  getVerifiedListeners(limit?: number): Promise<ListenerProfile[]>;
  getAvailableListeners(): Promise<ListenerProfile[]>;

  // Availability
  checkAvailability(listenerId: string): Promise<boolean>;
  getAvailableSlots(listenerId: string): Promise<Date[]>;
}
