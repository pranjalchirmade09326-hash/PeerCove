/**
 * Infrastructure: Listener Service Implementation
 * Implements domain service interface using repository
 * Infrastructure layer - coordinates repository and domain
 */

import { ListenerProfile } from '../../domain/entities/ListenerProfile';
import { ListenerStats } from '../../domain/entities/ListenerStats';
import { IListenerService } from '../../domain/interfaces/IListenerService';
import { ListenerRepository } from './repositories/ListenerRepository';

export class ListenerServiceImpl implements IListenerService {
  constructor(private repository: ListenerRepository) {}

  async getListenerProfile(listenerId: string): Promise<ListenerProfile> {
    return this.repository.fetchListenerProfile(listenerId);
  }

  async updateListenerProfile(
    listenerId: string,
    updates: Partial<ListenerProfile>
  ): Promise<ListenerProfile> {
    // Get current profile
    const current = await this.repository.fetchListenerProfile(listenerId);

    // Merge updates (in real implementation, send to backend)
    const updated = {
      ...current,
      ...updates,
    };

    // Validate and return
    return new ListenerProfile(updated);
  }

  async validateListenerLicense(licenseNumber: string): Promise<boolean> {
    try {
      // Implementation would verify license with external service
      return licenseNumber.length >= 5;
    } catch (error) {
      console.error('Error validating license:', error);
      return false;
    }
  }

  async getListenerStats(listenerId: string): Promise<ListenerStats> {
    return this.repository.fetchListenerStats(listenerId);
  }

  async updateListenerStats(
    listenerId: string,
    stats: Partial<ListenerStats>
  ): Promise<ListenerStats> {
    // Get current stats
    const current = await this.repository.fetchListenerStats(listenerId);

    // In real implementation, send update to backend
    const updated = {
      ...current,
      ...stats,
    };

    // Validate and return
    return new ListenerStats(updated);
  }

  async searchListenersBySpecialization(
    specialization: string,
    limit: number = 20
  ): Promise<ListenerProfile[]> {
    return this.repository.searchListeners(specialization, limit);
  }

  async getVerifiedListeners(limit: number = 20): Promise<ListenerProfile[]> {
    const listeners = await this.repository.getAvailableListeners(limit);
    return listeners.filter(
      (listener) => listener.isVerified() && listener.verificationStatus === 'verified'
    );
  }

  async getAvailableListeners(): Promise<ListenerProfile[]> {
    return this.repository.getAvailableListeners();
  }

  async checkAvailability(listenerId: string): Promise<boolean> {
    return this.repository.checkAvailability(listenerId);
  }

  async getAvailableSlots(listenerId: string): Promise<Date[]> {
    // In real implementation, fetch from backend
    // For now, return mock slots
    const slots: Date[] = [];
    const now = new Date();

    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(10, 0, 0, 0);

      slots.push(date);
      const afternoon = new Date(date);
      afternoon.setHours(14, 0, 0, 0);
      slots.push(afternoon);
    }

    return slots;
  }
}
