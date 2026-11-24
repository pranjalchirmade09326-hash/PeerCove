/**
 * Domain Entity: SafetyStats
 * Represents the statistics and metrics for safety monitoring
 * Domain layer - contains business logic for stats calculations
 */

export interface SafetyStatsProps {
  safety_id: string;
  high_risk_users: number;
  alerts_active: number;
  incidents_reported: number;
  avg_response_time_minutes: number;
  escalations_made: number;
  assessment_completion_rate: number; // 0-100%
  critical_cases: number;
  created_at: Date;
  updated_at: Date;
}

export class SafetyStats {
  private readonly props: SafetyStatsProps;

  constructor(props: SafetyStatsProps) {
    this.validateStats(props);
    this.props = {
      ...props,
      created_at:
        props.created_at instanceof Date ? props.created_at : new Date(props.created_at),
      updated_at:
        props.updated_at instanceof Date ? props.updated_at : new Date(props.updated_at),
    };
  }

  private validateStats(props: SafetyStatsProps): void {
    if (!props.safety_id || props.safety_id.trim() === '') {
      throw new Error('Safety ID is required');
    }

    if (props.high_risk_users < 0) {
      throw new Error('High risk users cannot be negative');
    }

    if (props.alerts_active < 0) {
      throw new Error('Active alerts cannot be negative');
    }

    if (props.incidents_reported < 0) {
      throw new Error('Incidents reported cannot be negative');
    }

    if (props.avg_response_time_minutes < 0) {
      throw new Error('Response time cannot be negative');
    }

    if (props.escalations_made < 0) {
      throw new Error('Escalations cannot be negative');
    }

    if (props.assessment_completion_rate < 0 || props.assessment_completion_rate > 100) {
      throw new Error('Assessment completion rate must be between 0 and 100');
    }

    if (props.critical_cases < 0) {
      throw new Error('Critical cases cannot be negative');
    }
  }

  // Getters
  get safety_id(): string {
    return this.props.safety_id;
  }

  get high_risk_users(): number {
    return this.props.high_risk_users;
  }

  get alerts_active(): number {
    return this.props.alerts_active;
  }

  get incidents_reported(): number {
    return this.props.incidents_reported;
  }

  get avg_response_time_minutes(): number {
    return this.props.avg_response_time_minutes;
  }

  get escalations_made(): number {
    return this.props.escalations_made;
  }

  get assessment_completion_rate(): number {
    return this.props.assessment_completion_rate;
  }

  get critical_cases(): number {
    return this.props.critical_cases;
  }

  get created_at(): Date {
    return new Date(this.props.created_at);
  }

  get updated_at(): Date {
    return new Date(this.props.updated_at);
  }

  // Business logic methods
  getTotalUrgentCases(): number {
    return this.props.high_risk_users + this.props.critical_cases;
  }

  getAlertSeverityRatio(): number {
    if (this.props.alerts_active === 0) return 0;
    return (this.props.critical_cases / this.props.alerts_active) * 100;
  }

  getIncidentTrend(): 'improving' | 'stable' | 'worsening' {
    // Can be extended with historical data
    return 'stable';
  }

  isResponseTimeAcceptable(): boolean {
    return this.props.avg_response_time_minutes <= 60; // 1 hour threshold
  }

  getEscalationRate(): number {
    if (this.props.incidents_reported === 0) return 0;
    return (this.props.escalations_made / this.props.incidents_reported) * 100;
  }

  getOverallHealthScore(): number {
    let score = 100;

    // Deduct for high risk users
    score -= Math.min(this.props.high_risk_users * 5, 25);

    // Deduct for critical cases
    score -= Math.min(this.props.critical_cases * 10, 30);

    // Deduct for slow response times
    if (this.props.avg_response_time_minutes > 60) {
      score -= Math.min((this.props.avg_response_time_minutes - 60) / 10, 15);
    }

    // Reward for good assessment completion
    score += (this.props.assessment_completion_rate / 100) * 20;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  getSystemStatus(): 'healthy' | 'warning' | 'critical' {
    const healthScore = this.getOverallHealthScore();
    if (healthScore >= 70) return 'healthy';
    if (healthScore >= 40) return 'warning';
    return 'critical';
  }

  hasUrgentCases(): boolean {
    return this.getTotalUrgentCases() > 0;
  }

  needsImmedateAttention(): boolean {
    return this.props.alerts_active > 5 || this.props.critical_cases > 0;
  }
}
