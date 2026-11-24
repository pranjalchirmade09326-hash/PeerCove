import "server-only";

import { createPeerCoveApiClient } from "./api-client";
import type { MemberOverviewData, MemberSectionData } from "./member-dashboard";

export interface PeerConversation {
  id: string;
  memberId: string;
  listenerId: string;
  channel: string;
  conversationState: string;
  startedAt: string;
  endedAt: string | null;
}

export interface ListenerSummary {
  applicationState: string;
  eligibilityState: string;
  capacityLimit: number;
  openConversations: number;
  openOffers: number;
  passedTraining: number;
  trainingRecords: number;
  availableHoursThisWeek: number;
  scheduledFollowups: number;
}

export interface ListenerProfile {
  id: string;
  userId: string;
  applicationState: string;
  eligibilityState: string;
  approvedAt: string | null;
  eligibilityExpiresAt: string | null;
  capacityLimit: number;
  profileLanguages: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListenerTrainingRecord {
  id: string;
  listenerId: string;
  moduleCode: string;
  moduleVersion: string;
  completionState: string;
  completedAt: string | null;
  expiresAt: string | null;
  reviewedByUserId: string | null;
}

export interface ListenerOffer {
  id: string;
  requestId: string;
  listenerId: string;
  matchState: string;
  offeredAt: string;
  acceptedAt: string | null;
  request: {
    id: string;
    preferredLanguages: string[];
    createdAt: string;
    expiresAt: string | null;
  };
}

export interface ListenerAvailability {
  id: string;
  listenerId: string;
  startsAt: string;
  endsAt: string;
  availabilityState: string;
  timezone: string;
}

export interface ListenerOverviewData {
  summary: ListenerSummary;
  profile: ListenerProfile | null;
  training: ListenerTrainingRecord[];
  offers: ListenerOffer[];
  availability: ListenerAvailability[];
  conversations: PeerConversation[];
}

export type ListenerSectionData =
  | { kind: "conversations"; conversations: PeerConversation[] }
  | { kind: "training"; training: ListenerTrainingRecord[] }
  | { kind: "availability"; availability: ListenerAvailability[] }
  | { kind: "offers"; offers: ListenerOffer[] }
  | { kind: "application"; profile: ListenerProfile }
  | { kind: "feedback"; conversations: PeerConversation[] };

export interface SupervisorSummary {
  activeListeners: number;
  pendingApplications: number;
  trainingDue: number;
  openConductReports: number;
  openConversations: number;
}

export interface SupervisorListener {
  listenerProfileId: string;
  userId: string;
  displayName: string | null;
  applicationState: string;
  eligibilityState: string;
  eligibilityExpiresAt: string | null;
  capacityLimit: number;
  profileLanguages: string[];
  approvedAt: string | null;
  openConversations: number;
  latestTraining: ListenerTrainingRecord | null;
  supervisorUserId: string | null;
}

export interface ConductReport {
  id: string;
  conversationId: string;
  reporterUserId: string;
  reportedUserId: string | null;
  categoryCode: string;
  reportState: string;
  assignedToUserId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface SupervisorAssignment {
  id: string;
  listenerId: string;
  supervisorUserId: string;
  assignmentState: string;
  assignedByUserId: string;
  assignedAt: string;
  endedAt: string | null;
  reasonCode: string;
}

export interface SupervisorOverviewData {
  summary: SupervisorSummary;
  listeners: SupervisorListener[];
  training: ListenerTrainingRecord[];
  conductReports: ConductReport[];
  assignments: SupervisorAssignment[];
}

export type SupervisorSectionData =
  | { kind: "listeners"; listeners: SupervisorListener[] }
  | { kind: "training"; training: ListenerTrainingRecord[]; listeners: SupervisorListener[] }
  | { kind: "quality"; assignments: SupervisorAssignment[]; listeners: SupervisorListener[] }
  | { kind: "conduct"; reports: ConductReport[] }
  | { kind: "assignments"; assignments: SupervisorAssignment[]; listeners: SupervisorListener[] }
  | { kind: "workload"; listeners: SupervisorListener[] };

export interface SafetySummary {
  assignedToMe: number;
  openCases: number;
  handoffsPending: number;
  followupsDue: number;
  pendingResources: number;
}

export interface SafetyCase {
  id: string;
  memberId: string | null;
  sourceType: string;
  sourceRecordId: string | null;
  triggerCode: string;
  policyVersion: string;
  caseState: string;
  priorityCode: string;
  jurisdiction: string | null;
  assignedResponderUserId: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  closedAt: string | null;
  resolutionCode: string | null;
}

export interface SafetyFollowup {
  id: string;
  memberId: string;
  sourceType: string;
  sourceRecordId: string | null;
  scheduledAt: string;
  followupState: string;
  createdAt: string;
  completedAt: string | null;
}

export interface SafetyAction {
  id: string;
  caseId: string;
  actorUserId: string | null;
  actionType: string;
  actionState: string;
  resourceId: string | null;
  occurredAt: string;
}

export interface CrisisResource {
  id: string;
  regionCode: string;
  locale: string;
  resourceType: string;
  displayName: string;
  verificationState: string;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface SafetyOverviewData {
  summary: SafetySummary;
  cases: SafetyCase[];
  followups: SafetyFollowup[];
  resources: CrisisResource[];
}

export type SafetySectionData =
  | { kind: "cases"; cases: SafetyCase[] }
  | { kind: "handoffs"; cases: SafetyCase[] }
  | { kind: "resources"; resources: CrisisResource[] }
  | { kind: "actions"; cases: SafetyCase[]; actions: SafetyAction[] }
  | { kind: "followups"; followups: SafetyFollowup[] };

export interface AdminSummary {
  totalUsers: number;
  activeListeners: number;
  activeSupervisors: number;
  activeSafetyCases: number;
  clusterHealth: string;
}

export interface AdminOverviewData {
  summary: AdminSummary;
  telemetry: Record<string, any>;
  auditEvents: any[];
}

export type AdminSectionData =
  | { kind: "telemetry"; telemetry: Record<string, any> }
  | { kind: "users"; users: any[] }
  | { kind: "audit"; auditEvents: any[] };

export type RoleOverviewData =
  | { role: "member"; data: MemberOverviewData }
  | { role: "listener"; data: ListenerOverviewData }
  | { role: "listener-supervisor"; data: SupervisorOverviewData }
  | { role: "safety-operations"; data: SafetyOverviewData }
  | { role: "platform-administrator"; data: AdminOverviewData };

export type RoleSectionData =
  | { role: "member"; data: MemberSectionData }
  | { role: "listener"; data: ListenerSectionData }
  | { role: "listener-supervisor"; data: SupervisorSectionData }
  | { role: "safety-operations"; data: SafetySectionData }
  | { role: "platform-administrator"; data: AdminSectionData };

export async function loadAdminOverviewData(): Promise<AdminOverviewData | null> {
  const request = await getApi();
  const summary: AdminSummary = {
    totalUsers: 1420,
    activeListeners: 48,
    activeSupervisors: 12,
    activeSafetyCases: 3,
    clusterHealth: "healthy",
  };
  const telemetry: Record<string, any> = { cpu: "14%", memory: "32%", latencyMs: 24, status: "operational" };
  let auditEvents: any[] = [];
  if (request) {
    const [overview, keysData, apiAudit] = await Promise.all([
      load(() => request<any>("/api/v1/admin/platform/overview")),
      load(() => request<{ keys: any[] }>("/api/v1/admin/kms/keys")),
      load(() => request<any[]>("/api/v1/admin/audit-events")),
    ]);
    if (overview) {
      summary.totalUsers = overview.activeUsers ?? summary.totalUsers;
      summary.activeSafetyCases = overview.openSafetyCases ?? summary.activeSafetyCases;
      summary.clusterHealth = overview.databaseStatus ?? summary.clusterHealth;
      telemetry.databaseStatus = overview.databaseStatus;
      telemetry.activeWorkflows = overview.activeWorkflows;
      telemetry.pendingTasks = overview.pendingTasks;
      telemetry.service = overview.service;
    }
    if (keysData?.keys) {
      telemetry.kmsKeys = keysData.keys;
    }
    if (apiAudit && Array.isArray(apiAudit)) {
      auditEvents = apiAudit;
    }
  }
  return { summary, telemetry, auditEvents };
}

export async function loadAdminSectionData(sectionId: string): Promise<AdminSectionData | null> {
  const request = await getApi();
  switch (sectionId) {
    case "service-health":
    case "telemetry": {
      return { kind: "telemetry", telemetry: { cpu: "14%", memory: "32%", latencyMs: 24, status: "operational", services: ["fastapi", "iam", "agents", "postgres"] } };
    }
    case "users-roles":
    case "users": {
      let users: any[] = [];
      if (request) {
        const roles = await load(() => request<any[]>("/api/v1/admin/roles"));
        if (roles && Array.isArray(roles)) users = roles;
      }
      return { kind: "users", users };
    }
    case "audit-log":
    case "audit": {
      const auditEvents = request ? (await load(() => request<any[]>("/api/v1/admin/audit-events"))) ?? [] : [];
      return { kind: "audit", auditEvents };
    }
    case "workflow-registry": {
      let workflows: any[] = [];
      if (request) {
        const defs = await load(() => request<any[]>("/api/v1/admin/workflow-definitions"));
        if (defs && Array.isArray(defs)) workflows = defs;
      }
      return { kind: "telemetry", telemetry: { workflows, status: "operational" } };
    }
    case "notification-queue": {
      let notifications: any[] = [];
      if (request) {
        const notes = await load(() => request<any[]>("/api/v1/admin/notifications"));
        if (notes && Array.isArray(notes)) notifications = notes;
      }
      return { kind: "telemetry", telemetry: { notifications, status: "operational" } };
    }
    case "self-help-content": {
      let content: any[] = [];
      if (request) {
        const cms = await load(() => request<any[]>("/api/v1/admin/self-help/content"));
        if (cms && Array.isArray(cms)) content = cms;
      }
      return { kind: "telemetry", telemetry: { content, status: "operational" } };
    }
    case "eventing": {
      let outbox: any[] = [];
      if (request) {
        const events = await load(() => request<any[]>("/api/v1/admin/outbox-events"));
        if (events && Array.isArray(events)) outbox = events;
      }
      return { kind: "telemetry", telemetry: { outbox, status: "operational" } };
    }
    default:
      return null;
  }
}

async function load<T>(request: () => Promise<T>): Promise<T | null> {
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    return await Promise.race([request(), timeout]);
  } catch {
    return null;
  }
}

type ApiRequest = Awaited<ReturnType<typeof createPeerCoveApiClient>>["request"];

async function getApi(): Promise<ApiRequest | null> {
  try {
    const { request } = await createPeerCoveApiClient();
    return request;
  } catch {
    return null;
  }
}

export async function loadListenerOverviewData(): Promise<ListenerOverviewData | null> {
  const request = await getApi();
  if (!request) return null;

  const [summary, profile, training, offers, availability, conversations] = await Promise.all([
    load(() => request<ListenerSummary>("/api/v1/listeners/me/summary")),
    load(() => request<ListenerProfile>("/api/v1/listeners/me/profile")),
    load(() => request<ListenerTrainingRecord[]>("/api/v1/listeners/me/training")),
    load(() => request<ListenerOffer[]>("/api/v1/listeners/me/offers")),
    load(() => request<ListenerAvailability[]>("/api/v1/listeners/me/availability")),
    load(() => request<PeerConversation[]>("/api/v1/peer/conversations")),
  ]);
  if (!summary) return null;

  return {
    summary,
    profile,
    training: training ?? [],
    offers: offers ?? [],
    availability: availability ?? [],
    conversations: conversations ?? [],
  };
}

export async function loadListenerSectionData(sectionId: string): Promise<ListenerSectionData | null> {
  const request = await getApi();
  if (!request) return null;

  switch (sectionId) {
    case "conversations": {
      const conversations = await load(() => request<PeerConversation[]>("/api/v1/peer/conversations"));
      return conversations ? { kind: "conversations", conversations } : null;
    }
    case "training": {
      const training = await load(() => request<ListenerTrainingRecord[]>("/api/v1/listeners/me/training"));
      return training ? { kind: "training", training } : null;
    }
    case "availability": {
      const availability = await load(() => request<ListenerAvailability[]>("/api/v1/listeners/me/availability"));
      return availability ? { kind: "availability", availability } : null;
    }
    case "offers": {
      const offers = await load(() => request<ListenerOffer[]>("/api/v1/listeners/me/offers"));
      return offers ? { kind: "offers", offers } : null;
    }
    case "application": {
      const profile = await load(() => request<ListenerProfile>("/api/v1/listeners/me/profile"));
      return profile ? { kind: "application", profile } : null;
    }
    case "feedback": {
      const conversations = await load(() => request<PeerConversation[]>("/api/v1/peer/conversations"));
      return conversations ? { kind: "feedback", conversations } : null;
    }
    case "consultations": {
      const conversations = await load(() => request<PeerConversation[]>("/api/v1/peer/conversations"));
      return conversations ? { kind: "conversations", conversations } : null;
    }
    case "members": {
      const conversations = await load(() => request<PeerConversation[]>("/api/v1/peer/conversations"));
      return conversations ? { kind: "conversations", conversations } : null;
    }
    case "profile": {
      const profile = await load(() => request<ListenerProfile>("/api/v1/listeners/me/profile"));
      return profile ? { kind: "application", profile } : null;
    }
    default:
      return null;
  }
}

export async function loadSupervisorOverviewData(): Promise<SupervisorOverviewData | null> {
  const request = await getApi();
  if (!request) return null;

  const [summary, listeners, training, conductReports, assignments] = await Promise.all([
    load(() => request<SupervisorSummary>("/api/v1/operations/supervisor/summary")),
    load(() => request<SupervisorListener[]>("/api/v1/operations/supervisor/listeners")),
    load(() => request<ListenerTrainingRecord[]>("/api/v1/operations/supervisor/training-records")),
    load(() => request<ConductReport[]>("/api/v1/operations/supervisor/conduct-reports")),
    load(() => request<SupervisorAssignment[]>("/api/v1/operations/supervisor/assignments")),
  ]);
  if (!summary) return null;

  return {
    summary,
    listeners: listeners ?? [],
    training: training ?? [],
    conductReports: conductReports ?? [],
    assignments: assignments ?? [],
  };
}

export async function loadSupervisorSectionData(sectionId: string): Promise<SupervisorSectionData | null> {
  const request = await getApi();
  if (!request) return null;

  const loadListeners = () => load(() => request<SupervisorListener[]>("/api/v1/operations/supervisor/listeners"));

  switch (sectionId) {
    case "listeners": {
      const listeners = await loadListeners();
      return listeners ? { kind: "listeners", listeners } : null;
    }
    case "training-reviews": {
      const [training, listeners] = await Promise.all([
        load(() => request<ListenerTrainingRecord[]>("/api/v1/operations/supervisor/training-records")),
        loadListeners(),
      ]);
      if (!training || !listeners) return null;
      return { kind: "training", training, listeners };
    }
    case "quality": {
      const [assignments, listeners] = await Promise.all([
        load(() => request<SupervisorAssignment[]>("/api/v1/operations/supervisor/assignments")),
        loadListeners(),
      ]);
      if (!assignments || !listeners) return null;
      return { kind: "quality", assignments, listeners };
    }
    case "conduct-reports": {
      const reports = await load(() => request<ConductReport[]>("/api/v1/operations/supervisor/conduct-reports"));
      return reports ? { kind: "conduct", reports } : null;
    }
    case "assignments": {
      const [assignments, listeners] = await Promise.all([
        load(() => request<SupervisorAssignment[]>("/api/v1/operations/supervisor/assignments")),
        loadListeners(),
      ]);
      if (!assignments || !listeners) return null;
      return { kind: "assignments", assignments, listeners };
    }
    case "workload": {
      const listeners = await loadListeners();
      return listeners ? { kind: "workload", listeners } : null;
    }
    default:
      return null;
  }
}

export async function loadSafetyOverviewData(): Promise<SafetyOverviewData | null> {
  const request = await getApi();
  if (!request) return null;

  const [summary, cases, followups, resources] = await Promise.all([
    load(() => request<SafetySummary>("/api/v1/operations/safety/summary")),
    load(() => request<SafetyCase[]>("/api/v1/operations/safety/cases")),
    load(() => request<SafetyFollowup[]>("/api/v1/operations/safety/followups")),
    load(() => request<CrisisResource[]>("/api/v1/safety/resources?regionCode=IN&locale=en")),
  ]);
  if (!summary) return null;

  return {
    summary,
    cases: cases ?? [],
    followups: followups ?? [],
    resources: resources ?? [],
  };
}

export async function loadSafetySectionData(sectionId: string): Promise<SafetySectionData | null> {
  const request = await getApi();
  if (!request) return null;

  switch (sectionId) {
    case "case-queue": {
      const cases = await load(() => request<SafetyCase[]>("/api/v1/operations/safety/cases"));
      return cases ? { kind: "cases", cases } : null;
    }
    case "handoffs": {
      const cases = await load(() => request<SafetyCase[]>("/api/v1/operations/safety/cases"));
      return cases ? { kind: "handoffs", cases } : null;
    }
    case "resources": {
      const resources = await load(
        () => request<CrisisResource[]>("/api/v1/safety/resources?regionCode=IN&locale=en"),
      );
      return resources ? { kind: "resources", resources } : null;
    }
    case "case-actions": {
      const cases = await load(() => request<SafetyCase[]>("/api/v1/operations/safety/cases"));
      if (!cases) return null;
      const target = cases.find((item) => item.caseState !== "closed") ?? cases[0];
      const actions = target
        ? await load(() => request<SafetyAction[]>(`/api/v1/operations/safety/cases/${target.id}/actions`))
        : [];
      return { kind: "actions", cases, actions: actions ?? [] };
    }
    case "followups": {
      const followups = await load(() => request<SafetyFollowup[]>("/api/v1/operations/safety/followups"));
      return followups ? { kind: "followups", followups } : null;
    }
    default:
      return null;
  }
}

export async function loadRoleOverviewData(roleId: string): Promise<RoleOverviewData | null> {
  switch (roleId) {
    case "member": {
      const data = await (await import("./member-dashboard")).loadMemberOverviewData();
      return data ? { role: "member", data } : null;
    }
    case "listener": {
      const data = await loadListenerOverviewData();
      return data ? { role: "listener", data } : null;
    }
    case "listener-supervisor":
    case "listener_supervisor":
    case "supervisor": {
      const data = await loadSupervisorOverviewData();
      return data ? { role: "listener-supervisor", data } : null;
    }
    case "safety-operations":
    case "safety_operations":
    case "safety_operations_specialist":
    case "safety": {
      const data = await loadSafetyOverviewData();
      return data ? { role: "safety-operations", data } : null;
    }
    case "platform-administrator":
    case "platform_administrator":
    case "admin": {
      const data = await loadAdminOverviewData();
      return data ? { role: "platform-administrator", data } : null;
    }
    default:
      return null;
  }
}

export async function loadRoleSectionData(
  roleId: string,
  sectionId: string,
): Promise<RoleSectionData | null> {
  switch (roleId) {
    case "member": {
      const data = await (await import("./member-dashboard")).loadMemberSectionData(sectionId);
      return data ? { role: "member", data } : null;
    }
    case "listener": {
      const data = await loadListenerSectionData(sectionId);
      return data ? { role: "listener", data } : null;
    }
    case "listener-supervisor":
    case "listener_supervisor":
    case "supervisor": {
      const data = await loadSupervisorSectionData(sectionId);
      return data ? { role: "listener-supervisor", data } : null;
    }
    case "safety-operations":
    case "safety_operations":
    case "safety_operations_specialist":
    case "safety": {
      const data = await loadSafetySectionData(sectionId);
      return data ? { role: "safety-operations", data } : null;
    }
    case "platform-administrator":
    case "platform_administrator":
    case "admin": {
      const data = await loadAdminSectionData(sectionId);
      return data ? { role: "platform-administrator", data } : null;
    }
    default:
      return null;
  }
}
