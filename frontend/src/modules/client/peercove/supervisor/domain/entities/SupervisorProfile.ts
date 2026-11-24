/**
 * Domain Entity: SupervisorProfile
 * Represents the core profile data of a supervisor
 * Domain layer - framework independent, pure business logic
 */

export interface SupervisorProfileProps {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  teamSize: number;
  performanceRating: number;
  department: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SupervisorProfile {
  private readonly props: SupervisorProfileProps;

  constructor(props: SupervisorProfileProps) {
    this.validateProfile(props);
    this.props = {
      ...props,
      createdAt: props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt),
      updatedAt: props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt),
    };
  }

  private validateProfile(props: SupervisorProfileProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Supervisor ID is required');
    }

    if (!props.userId || props.userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!props.firstName || props.firstName.trim() === '') {
      throw new Error('First name is required');
    }

    if (!props.lastName || props.lastName.trim() === '') {
      throw new Error('Last name is required');
    }

    if (!this.isValidEmail(props.email)) {
      throw new Error('Valid email is required');
    }

    if (props.teamSize < 0) {
      throw new Error('Team size cannot be negative');
    }

    if (props.performanceRating < 0 || props.performanceRating > 5) {
      throw new Error('Performance rating must be between 0 and 5');
    }

    if (!props.department || props.department.trim() === '') {
      throw new Error('Department is required');
    }

    if (!['junior', 'mid', 'senior', 'lead'].includes(props.experienceLevel)) {
      throw new Error('Invalid experience level');
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

  get userId(): string {
    return this.props.userId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get teamSize(): number {
    return this.props.teamSize;
  }

  get performanceRating(): number {
    return this.props.performanceRating;
  }

  get department(): string {
    return this.props.department;
  }

  get experienceLevel(): 'junior' | 'mid' | 'senior' | 'lead' {
    return this.props.experienceLevel;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // Business logic methods
  getInitials(): string {
    return `${this.props.firstName[0]}${this.props.lastName[0]}`.toUpperCase();
  }

  isHighPerformer(): boolean {
    return this.props.performanceRating >= 4.0;
  }

  isExperienced(): boolean {
    return ['senior', 'lead'].includes(this.props.experienceLevel);
  }

  hasLargeTeam(): boolean {
    return this.props.teamSize > 10;
  }

  getRatingLabel(): string {
    if (this.props.performanceRating >= 4.5) return 'Excellent';
    if (this.props.performanceRating >= 4.0) return 'Very Good';
    if (this.props.performanceRating >= 3.0) return 'Good';
    if (this.props.performanceRating >= 2.0) return 'Fair';
    return 'Needs Improvement';
  }

  getExperienceLevelLabel(): string {
    const labels: Record<'junior' | 'mid' | 'senior' | 'lead', string> = {
      junior: 'Junior Supervisor',
      mid: 'Mid-Level Supervisor',
      senior: 'Senior Supervisor',
      lead: 'Lead Supervisor',
    };
    return labels[this.props.experienceLevel];
  }
}
