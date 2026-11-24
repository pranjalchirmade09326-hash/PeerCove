/**
 * Application DTO (Data Transfer Object)
 * Input/Output types for use cases
 * Decouples API contracts from domain entities
 */

// Input DTOs
export interface GetListenerProfileInput {
  listenerId: string;
}

export interface GetListenerStatsInput {
  listenerId: string;
}

export interface UpdateListenerProfileInput {
  listenerId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
  specializations?: string[];
}

export interface SearchListenersInput {
  specialization?: string;
  minRating?: number;
  isVerifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

// Output DTOs
export interface GetListenerProfileOutput {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  specializations: string[];
  licenseNumber: string;
  yearsOfExperience: number;
  bio?: string;
  profileImageUrl?: string;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface GetListenerStatsOutput {
  listenerId: string;
  totalClients: number;
  activeClients: number;
  completedSessions: number;
  totalSessionHours: number;
  averageRating: number;
  totalReviews: number;
  responseTimeMinutes: number;
  availableSlots: number;
  upcomingAppointments: number;
  cancellationRate: number;
  clientRetention: number;
  averageSessionDuration: number;
  availabilityStatus: 'available' | 'limited' | 'unavailable';
  performanceScore: number;
}

export interface SearchListenersOutput {
  listeners: GetListenerProfileOutput[];
  total: number;
  hasMore: boolean;
}

// Result wrapper
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    duration: number;
  };
}
