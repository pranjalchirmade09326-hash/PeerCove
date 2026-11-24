/**
 * Domain Entity: ListenerStats
 * Represents the statistics and metrics for a listener
 * Domain layer - contains business logic for stats calculations
 */

export interface ListenerStatsProps {
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
  createdAt: Date;
  updatedAt: Date;
}

export class ListenerStats {
  private readonly props: ListenerStatsProps;

  constructor(props: ListenerStatsProps) {
    this.validateStats(props);
    this.props = {
      ...props,
      createdAt: props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt),
      updatedAt: props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt),
    };
  }

  private validateStats(props: ListenerStatsProps): void {
    if (!props.listenerId || props.listenerId.trim() === '') {
      throw new Error('Listener ID is required');
    }

    if (props.totalClients < 0) {
      throw new Error('Total clients cannot be negative');
    }

    if (props.activeClients < 0 || props.activeClients > props.totalClients) {
      throw new Error('Active clients must be between 0 and total clients');
    }

    if (props.completedSessions < 0) {
      throw new Error('Completed sessions cannot be negative');
    }

    if (props.totalSessionHours < 0) {
      throw new Error('Total session hours cannot be negative');
    }

    if (props.averageRating < 0 || props.averageRating > 5) {
      throw new Error('Average rating must be between 0 and 5');
    }

    if (props.totalReviews < 0) {
      throw new Error('Total reviews cannot be negative');
    }

    if (props.responseTimeMinutes < 0) {
      throw new Error('Response time cannot be negative');
    }

    if (props.availableSlots < 0) {
      throw new Error('Available slots cannot be negative');
    }

    if (props.upcomingAppointments < 0) {
      throw new Error('Upcoming appointments cannot be negative');
    }

    if (props.cancellationRate < 0 || props.cancellationRate > 100) {
      throw new Error('Cancellation rate must be between 0 and 100');
    }
  }

  // Getters
  get listenerId(): string {
    return this.props.listenerId;
  }

  get totalClients(): number {
    return this.props.totalClients;
  }

  get activeClients(): number {
    return this.props.activeClients;
  }

  get completedSessions(): number {
    return this.props.completedSessions;
  }

  get totalSessionHours(): number {
    return this.props.totalSessionHours;
  }

  get averageRating(): number {
    return this.props.averageRating;
  }

  get totalReviews(): number {
    return this.props.totalReviews;
  }

  get responseTimeMinutes(): number {
    return this.props.responseTimeMinutes;
  }

  get availableSlots(): number {
    return this.props.availableSlots;
  }

  get upcomingAppointments(): number {
    return this.props.upcomingAppointments;
  }

  get cancellationRate(): number {
    return this.props.cancellationRate;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // Business logic methods
  getClientRetention(): number {
    if (this.props.totalClients === 0) return 0;
    return (this.props.activeClients / this.props.totalClients) * 100;
  }

  getAverageSessionDuration(): number {
    if (this.props.completedSessions === 0) return 0;
    return this.props.totalSessionHours / this.props.completedSessions;
  }

  getAvailabilityStatus(): 'available' | 'limited' | 'unavailable' {
    if (this.props.availableSlots === 0) return 'unavailable';
    if (this.props.availableSlots <= 2) return 'limited';
    return 'available';
  }

  isReliable(): boolean {
    return this.props.cancellationRate < 10 && this.props.responseTimeMinutes < 120;
  }

  isHighRated(): boolean {
    return this.props.averageRating >= 4.5 && this.props.totalReviews >= 10;
  }

  getWorkloadStatus(): 'light' | 'moderate' | 'heavy' {
    const workloadPercentage = (this.props.activeClients / Math.max(this.props.totalClients, 1)) * 100;

    if (workloadPercentage < 30) return 'light';
    if (workloadPercentage < 70) return 'moderate';
    return 'heavy';
  }

  getPerformanceScore(): number {
    let score = 0;

    // Rating score (40%)
    score += (this.props.averageRating / 5) * 40;

    // Reliability score (30%)
    const reliabilityScore = Math.max(0, 100 - this.props.cancellationRate - (this.props.responseTimeMinutes / 2));
    score += (reliabilityScore / 100) * 30;

    // Client retention (20%)
    score += this.getClientRetention() * 0.2;

    // Experience score (10%)
    const yearsBonus = Math.min(this.props.totalSessionHours / 100, 10);
    score += yearsBonus;

    return Math.round(score);
  }
}
