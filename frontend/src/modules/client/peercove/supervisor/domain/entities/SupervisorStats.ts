/**
 * Domain Entity: SupervisorStats
 * Represents the performance and operational statistics of a supervisor
 * Domain layer - framework independent, pure business logic
 */

export interface SupervisorStatsProps {
  supervisorId: string;
  teamMembers: number;
  activeSessions: number;
  avgQualityScore: number;
  totalWorkload: number;
  teamProductivity: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SupervisorStats {
  private readonly props: SupervisorStatsProps;

  constructor(props: SupervisorStatsProps) {
    this.validateStats(props);
    this.props = {
      ...props,
      createdAt: props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt),
      updatedAt: props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt),
    };
  }

  private validateStats(props: SupervisorStatsProps): void {
    if (!props.supervisorId || props.supervisorId.trim() === '') {
      throw new Error('Supervisor ID is required');
    }

    if (props.teamMembers < 0) {
      throw new Error('Team members cannot be negative');
    }

    if (props.activeSessions < 0) {
      throw new Error('Active sessions cannot be negative');
    }

    if (props.avgQualityScore < 0 || props.avgQualityScore > 100) {
      throw new Error('Quality score must be between 0 and 100');
    }

    if (props.totalWorkload < 0) {
      throw new Error('Total workload cannot be negative');
    }

    if (props.teamProductivity < 0 || props.teamProductivity > 100) {
      throw new Error('Team productivity must be between 0 and 100');
    }
  }

  // Getters
  get supervisorId(): string {
    return this.props.supervisorId;
  }

  get teamMembers(): number {
    return this.props.teamMembers;
  }

  get activeSessions(): number {
    return this.props.activeSessions;
  }

  get avgQualityScore(): number {
    return this.props.avgQualityScore;
  }

  get totalWorkload(): number {
    return this.props.totalWorkload;
  }

  get teamProductivity(): number {
    return this.props.teamProductivity;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // Computed properties - business logic
  getAverageWorkloadPerMember(): number {
    if (this.props.teamMembers === 0) return 0;
    return this.props.totalWorkload / this.props.teamMembers;
  }

  getSessionUtilization(): number {
    if (this.props.teamMembers === 0) return 0;
    return (this.props.activeSessions / this.props.teamMembers) * 100;
  }

  getQualityStatus(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (this.props.avgQualityScore >= 85) return 'excellent';
    if (this.props.avgQualityScore >= 70) return 'good';
    if (this.props.avgQualityScore >= 50) return 'fair';
    return 'poor';
  }

  getProductivityStatus(): 'high' | 'normal' | 'low' {
    if (this.props.teamProductivity >= 80) return 'high';
    if (this.props.teamProductivity >= 60) return 'normal';
    return 'low';
  }

  getHealthScore(): number {
    const qualityWeight = 0.4;
    const productivityWeight = 0.4;
    const workloadWeight = 0.2;

    const qualityScore = this.props.avgQualityScore;
    const productivityScore = this.props.teamProductivity;
    const workloadScore = Math.min(100, (this.props.totalWorkload / 100) * 100);

    return (
      qualityScore * qualityWeight +
      productivityScore * productivityWeight +
      workloadScore * workloadWeight
    );
  }

  getWorkloadLevel(): 'low' | 'moderate' | 'high' | 'critical' {
    if (this.props.totalWorkload < 30) return 'low';
    if (this.props.totalWorkload < 60) return 'moderate';
    if (this.props.totalWorkload < 90) return 'high';
    return 'critical';
  }

  getNeedsAttention(): boolean {
    return (
      this.props.avgQualityScore < 70 ||
      this.props.teamProductivity < 60 ||
      this.getWorkloadLevel() === 'critical'
    );
  }
}
