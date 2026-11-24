/**
 * Domain Entity: AdminProfile
 * Represents the core profile data of an admin/platform manager
 * Domain layer - framework independent, pure business logic
 */

export interface AdminProfileProps {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super-admin' | 'moderator' | 'analyst';
  permissions: string[];
  departmentId: string;
  accessLevel: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminProfile {
  private readonly props: AdminProfileProps;

  constructor(props: AdminProfileProps) {
    this.validateProfile(props);
    this.props = {
      ...props,
      createdAt: props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt),
      updatedAt: props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt),
    };
  }

  private validateProfile(props: AdminProfileProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Admin ID is required');
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

    if (!['super-admin', 'moderator', 'analyst'].includes(props.role)) {
      throw new Error('Invalid admin role');
    }

    if (!props.permissions || props.permissions.length === 0) {
      throw new Error('At least one permission is required');
    }

    if (!props.departmentId || props.departmentId.trim() === '') {
      throw new Error('Department ID is required');
    }

    if (![1, 2, 3, 4, 5].includes(props.accessLevel)) {
      throw new Error('Access level must be between 1 and 5');
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

  get role(): 'super-admin' | 'moderator' | 'analyst' {
    return this.props.role;
  }

  get permissions(): string[] {
    return [...this.props.permissions];
  }

  get departmentId(): string {
    return this.props.departmentId;
  }

  get accessLevel(): 1 | 2 | 3 | 4 | 5 {
    return this.props.accessLevel;
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
  hasPermission(permission: string): boolean {
    return this.props.permissions.includes(permission);
  }

  canViewReports(): boolean {
    return this.hasPermission('view-reports') && this.props.isActive;
  }

  canManageUsers(): boolean {
    return this.hasPermission('manage-users') && 
           ['super-admin', 'moderator'].includes(this.props.role) && 
           this.props.isActive;
  }

  getDepartment(): string {
    return this.props.departmentId;
  }

  getInitials(): string {
    return `${this.props.firstName[0]}${this.props.lastName[0]}`.toUpperCase();
  }

  isHighPrivilege(): boolean {
    return this.props.accessLevel >= 4 && this.props.role === 'super-admin';
  }

  canAccessResource(resourceLevel: number): boolean {
    return this.props.accessLevel >= resourceLevel && this.props.isActive;
  }

  getRoleDisplayName(): string {
    const roleMap: Record<string, string> = {
      'super-admin': 'Super Administrator',
      'moderator': 'Moderator',
      'analyst': 'Analyst',
    };
    return roleMap[this.props.role] || this.props.role;
  }
}
