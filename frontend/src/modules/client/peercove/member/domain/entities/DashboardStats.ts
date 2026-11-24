/**
 * MemberDashboard Statistics Entity - Domain Layer
 *
 * Represents member dashboard statistics and metrics.
 *
 * Layer: Domain
 */

export interface DashboardStatsDTO {
  checkinsThisWeek: number;
  savedReflections: number;
  activeGoals: number;
  openSupportRequests: number;
  openConversations: number;
  queuedNotifications: number;
  openPrivacyRequests: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
}

export class DashboardStats {
  private readonly checkinsThisWeek: number;
  private readonly savedReflections: number;
  private readonly activeGoals: number;
  private readonly openSupportRequests: number;
  private readonly openConversations: number;
  private readonly queuedNotifications: number;
  private readonly openPrivacyRequests: number;
  private readonly totalAppointments: number;
  private readonly completedAppointments: number;
  private readonly pendingAppointments: number;
  private readonly cancelledAppointments: number;

  constructor(dto: DashboardStatsDTO) {
    this.checkinsThisWeek = dto.checkinsThisWeek || 0;
    this.savedReflections = dto.savedReflections || 0;
    this.activeGoals = dto.activeGoals || 0;
    this.openSupportRequests = dto.openSupportRequests || 0;
    this.openConversations = dto.openConversations || 0;
    this.queuedNotifications = dto.queuedNotifications || 0;
    this.openPrivacyRequests = dto.openPrivacyRequests || 0;
    this.totalAppointments = dto.totalAppointments || 0;
    this.completedAppointments = dto.completedAppointments || 0;
    this.pendingAppointments = dto.pendingAppointments || 0;
    this.cancelledAppointments = dto.cancelledAppointments || 0;

    this.validate();
  }

  private validate(): void {
    if (this.checkinsThisWeek < 0) throw new Error("checkinsThisWeek cannot be negative");
    if (this.savedReflections < 0) throw new Error("savedReflections cannot be negative");
    if (this.activeGoals < 0) throw new Error("activeGoals cannot be negative");
  }

  getCheckinsThisWeek(): number { return this.checkinsThisWeek; }
  getSavedReflections(): number { return this.savedReflections; }
  getActiveGoals(): number { return this.activeGoals; }
  getOpenSupportRequests(): number { return this.openSupportRequests; }
  getOpenConversations(): number { return this.openConversations; }
  getQueuedNotifications(): number { return this.queuedNotifications; }
  getOpenPrivacyRequests(): number { return this.openPrivacyRequests; }
  getTotalAppointments(): number { return this.totalAppointments; }
  getCompletedAppointments(): number { return this.completedAppointments; }
  getPendingAppointments(): number { return this.pendingAppointments; }
  getCancelledAppointments(): number { return this.cancelledAppointments; }

  getAppointmentCompletionRate(): number {
    if (this.totalAppointments === 0) return 0;
    return Math.round((this.completedAppointments / this.totalAppointments) * 100);
  }

  hasActiveEngagement(): boolean {
    return (
      this.checkinsThisWeek > 0 ||
      this.openConversations > 0 ||
      this.openSupportRequests > 0
    );
  }

  toDTO(): DashboardStatsDTO {
    return {
      checkinsThisWeek: this.checkinsThisWeek,
      savedReflections: this.savedReflections,
      activeGoals: this.activeGoals,
      openSupportRequests: this.openSupportRequests,
      openConversations: this.openConversations,
      queuedNotifications: this.queuedNotifications,
      openPrivacyRequests: this.openPrivacyRequests,
      totalAppointments: this.totalAppointments,
      completedAppointments: this.completedAppointments,
      pendingAppointments: this.pendingAppointments,
      cancelledAppointments: this.cancelledAppointments,
    };
  }
}
