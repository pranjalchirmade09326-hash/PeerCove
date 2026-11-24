/**
 * Domain Entity: ListenerProfile
 * Represents the core profile data of a listener (therapist/counselor)
 * Domain layer - framework independent, pure business logic
 */

export interface ListenerProfileProps {
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
  createdAt: Date;
  updatedAt: Date;
}

export class ListenerProfile {
  private readonly props: ListenerProfileProps;

  constructor(props: ListenerProfileProps) {
    this.validateProfile(props);
    this.props = {
      ...props,
      createdAt: props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt),
      updatedAt: props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt),
    };
  }

  private validateProfile(props: ListenerProfileProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Listener ID is required');
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

    if (!props.licenseNumber || props.licenseNumber.trim() === '') {
      throw new Error('License number is required');
    }

    if (props.yearsOfExperience < 0) {
      throw new Error('Years of experience cannot be negative');
    }

    if (!props.specializations || props.specializations.length === 0) {
      throw new Error('At least one specialization is required');
    }

    if (!['pending', 'verified', 'rejected'].includes(props.verificationStatus)) {
      throw new Error('Invalid verification status');
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

  get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  get specializations(): string[] {
    return [...this.props.specializations];
  }

  get licenseNumber(): string {
    return this.props.licenseNumber;
  }

  get yearsOfExperience(): number {
    return this.props.yearsOfExperience;
  }

  get bio(): string | undefined {
    return this.props.bio;
  }

  get profileImageUrl(): string | undefined {
    return this.props.profileImageUrl;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get verificationStatus(): 'pending' | 'verified' | 'rejected' {
    return this.props.verificationStatus;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // Business logic methods
  isVerified(): boolean {
    return this.props.verificationStatus === 'verified' && this.props.isActive;
  }

  isExperienced(): boolean {
    return this.props.yearsOfExperience >= 3;
  }

  hasSpecialization(specialization: string): boolean {
    return this.props.specializations.some(
      (s) => s.toLowerCase() === specialization.toLowerCase()
    );
  }

  getInitials(): string {
    return `${this.props.firstName[0]}${this.props.lastName[0]}`.toUpperCase();
  }
}
