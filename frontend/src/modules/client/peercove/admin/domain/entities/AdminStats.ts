/**
 * Domain Entity: AdminStats
 * Represents the statistics and metrics for an admin dashboard
 * Domain layer - contains business logic for stats calculations
 */

export interface AdminStatsProps {
  adminId: string;
  totalUsers: number;
  totalListeners: number;
  totalReports: number;
  totalSessions: number;
  activeModeration: number;
  reportsPending: number;
  avgResponseTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminStats {
  private readonly props: AdminStatsProps;

  constructor(props: AdminStatsProps) {
    this.validateStats(props);
    this.props = {
      ...props,
      createdAt: props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt),
      updatedAt: props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt),
    };
  }

  private validateStats(props: AdminStatsProps): void {
    if (!props.adminId || props.adminId.trim() === '') {
      throw new Error('Admin ID is required');
    }

    if (props.totalUsers < 0) {
      throw new Error('Total users cannot be negative');
    }

    if (props.totalListeners < 0) {
      throw new Error('Total listeners cannot be negative');
    }

    if (props.totalReports < 0) {
      throw new Error('Total reports cannot be negative');
    }

    if (props.totalSessions < 0) {
      throw new Error('Total sessions cannot be negative');
    }

    if (props.activeModeration < 0 || props.activeModeration > props.totalReports) {
      throw new Error('Active moderation must be between 0 and total reports');
    }

    if (props.reportsPending < 0 || props.reportsPending > props.totalReports) {
      throw new Error('Pending reports must be between 0 and total reports');
    }

    if (props.avgResponseTime < 0) {
      throw new Error('Average response time cannot be negative');
    }
  }

  // Getters
  get adminId(): string {
    return this.props.adminId;
  }

  get totalUsers(): number {
    return this.props.totalUsers;
  }

  get totalListeners(): number {
    return this.props.totalListeners;
  }

  get totalReports(): number {
    return this.props.totalReports;
  }

  get totalSessions(): number {
    return this.props.totalSessions;
  }

  get activeModeration(): number {
    return this.props.activeModeration;
  }

  get reportsPending(): number {
    return this.props.reportsPending;
  }

  get avgResponseTime(): number {
    return this.props.avgResponseTime;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // Business logic methods
  workloadScore(): number {
    const baseScore = this.reportsPending;
    const activeModerationFactor = this.activeModeration * 0.5;
    return Math.round(baseScore + activeModerationFactor);
  }

  efficiencyRating(): number {
    if (this.totalReports === 0) return 100;
    const resolvedReports = this.totalReports - this.reportsPending;
    const resolutionRate = (resolvedReports / this.totalReports) * 100;
    const responseEfficiency = Math.max(0, 100 - this.avgResponseTime / 10);
    return Math.round((resolutionRate + responseEfficiency) / 2);
  }

  teamHealth(): 'healthy' | 'warning' | 'critical' {
    const efficiency = this.efficiencyRating();
    const pendingRatio = this.reportsPending / Math.max(this.totalReports, 1);

    if (efficiency >= 80 && pendingRatio < 0.2) {
      return 'healthy';
    }

    if (efficiency >= 60 && pendingRatio < 0.4) {
      return 'warning';
    }

    return 'critical';
  }

  getSessionsPerListener(): number {
    if (this.totalListeners === 0) return 0;
    return Math.round(this.totalSessions / this.totalListeners);
  }

  getReportResolutionRate(): number {
    if (this.totalReports === 0) return 0;
    return Math.round(((this.totalReports - this.reportsPending) / this.totalReports) * 100);
  }

  getModerationProgress(): number {
    if (this.totalReports === 0) return 0;
    const resolved = this.totalReports - this.reportsPending;
    return Math.round((resolved / this.totalReports) * 100);
  }

  getUserGrowthIndicator(): 'stable' | 'growing' | 'declining' {
    // This would typically compare with previous data
    // For now, we'll use a simple heuristic
    if (this.totalUsers > 1000) return 'growing';
    if (this.totalUsers > 500) return 'stable';
    return 'declining';
  }

  getSystemStatus(): 'optimal' | 'nominal' | 'degraded' {
    const health = this.teamHealth();
    const efficiency = this.efficiencyRating();
    const avgResponseHealth = this.avgResponseTime < 60 ? 100 : this.avgResponseTime < 300 ? 60 : 20;

    const overallScore = (
      (efficiency * 0.4) +
      (avgResponseHealth * 0.3) +
      ((health === 'healthy' ? 100 : health === 'warning' ? 60 : 20) * 0.3)
    );

    if (overallScore >= 80) return 'optimal';
    if (overallScore >= 60) return 'nominal';
    return 'degraded';
  }
}
