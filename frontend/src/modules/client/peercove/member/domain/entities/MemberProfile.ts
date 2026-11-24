/**
 * MemberProfile Entity - Domain Layer
 *
 * Core domain model for member profiles.
 * Pure business logic without external dependencies.
 *
 * Layer: Domain
 */

export interface MemberProfileDTO {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  organization?: string;
  joinedDate: Date;
  lastActive: Date;
}

export class MemberProfile {
  private readonly id: string;
  private readonly userId: string;
  private readonly displayName: string;
  private readonly email: string;
  private readonly avatar?: string;
  private readonly bio?: string;
  private readonly organization?: string;
  private readonly joinedDate: Date;
  private readonly lastActive: Date;

  constructor(dto: MemberProfileDTO) {
    this.id = dto.id;
    this.userId = dto.userId;
    this.displayName = dto.displayName;
    this.email = dto.email;
    this.avatar = dto.avatar;
    this.bio = dto.bio;
    this.organization = dto.organization;
    this.joinedDate = dto.joinedDate;
    this.lastActive = dto.lastActive;

    this.validate();
  }

  private validate(): void {
    if (!this.id?.trim()) throw new Error("MemberProfile: id is required");
    if (!this.userId?.trim()) throw new Error("MemberProfile: userId is required");
    if (!this.displayName?.trim()) throw new Error("MemberProfile: displayName is required");
    if (!this.email?.includes("@")) throw new Error("MemberProfile: valid email is required");
  }

  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getDisplayName(): string { return this.displayName; }
  getEmail(): string { return this.email; }
  getAvatar(): string | undefined { return this.avatar; }
  getBio(): string | undefined { return this.bio; }
  getOrganization(): string | undefined { return this.organization; }
  getJoinedDate(): Date { return this.joinedDate; }
  getLastActive(): Date { return this.lastActive; }

  toDTO(): MemberProfileDTO {
    return {
      id: this.id,
      userId: this.userId,
      displayName: this.displayName,
      email: this.email,
      avatar: this.avatar,
      bio: this.bio,
      organization: this.organization,
      joinedDate: this.joinedDate,
      lastActive: this.lastActive,
    };
  }
}
