/**
 * Domain Entity: SafetyProfile
 * Represents the core profile data of a user for safety assessment
 * Domain layer - framework independent, pure business logic
 */

export interface SafetyProfileProps {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  risk_score: number; // 0-100 scale
  status: 'low' | 'medium' | 'high' | 'critical';
  last_assessment_date: Date;
  needs_intervention: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class SafetyProfile {
  private readonly props: SafetyProfileProps;

  constructor(props: SafetyProfileProps) {
    this.validateProfile(props);
    this.props = {
      ...props,
      last_assessment_date:
        props.last_assessment_date instanceof Date
          ? props.last_assessment_date
          : new Date(props.last_assessment_date),
      created_at:
        props.created_at instanceof Date ? props.created_at : new Date(props.created_at),
      updated_at:
        props.updated_at instanceof Date ? props.updated_at : new Date(props.updated_at),
    };
  }

  private validateProfile(props: SafetyProfileProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Safety Profile ID is required');
    }

    if (!props.user_id || props.user_id.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!props.first_name || props.first_name.trim() === '') {
      throw new Error('First name is required');
    }

    if (!props.last_name || props.last_name.trim() === '') {
      throw new Error('Last name is required');
    }

    if (!this.isValidEmail(props.email)) {
      throw new Error('Valid email is required');
    }

    if (props.risk_score < 0 || props.risk_score > 100) {
      throw new Error('Risk score must be between 0 and 100');
    }

    if (!['low', 'medium', 'high', 'critical'].includes(props.status)) {
      throw new Error('Invalid safety status');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Getters - immutable access
  get id(): string {
    return this.props.id;
  }

  get user_id(): string {
    return this.props.user_id;
  }

  get first_name(): string {
    return this.props.first_name;
  }

  get last_name(): string {
    return this.props.last_name;
  }

  get full_name(): string {
    return `${this.props.first_name} ${this.props.last_name}`;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get risk_score(): number {
    return this.props.risk_score;
  }

  get status(): 'low' | 'medium' | 'high' | 'critical' {
    return this.props.status;
  }

  get last_assessment_date(): Date {
    return new Date(this.props.last_assessment_date);
  }

  get needs_intervention(): boolean {
    return this.props.needs_intervention;
  }

  get is_active(): boolean {
    return this.props.is_active;
  }

  get created_at(): Date {
    return new Date(this.props.created_at);
  }

  get updated_at(): Date {
    return new Date(this.props.updated_at);
  }

  // Business logic methods
  getRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.props.risk_score >= 80) return 'critical';
    if (this.props.risk_score >= 60) return 'high';
    if (this.props.risk_score >= 40) return 'medium';
    return 'low';
  }

  isHighRisk(): boolean {
    return this.props.risk_score >= 60;
  }

  isCritical(): boolean {
    return this.props.risk_score >= 80;
  }

  needsImmediateAttention(): boolean {
    return this.props.needs_intervention && this.props.is_active;
  }

  getInitials(): string {
    return `${this.props.first_name[0]}${this.props.last_name[0]}`.toUpperCase();
  }

  isAssessmentOverdue(): boolean {
    const now = new Date();
    const lastAssessment = new Date(this.props.last_assessment_date);
    const daysDiff = (now.getTime() - lastAssessment.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 30;
  }

  getRiskTrend(): 'stable' | 'improving' | 'worsening' {
    return 'stable';
  }
}
