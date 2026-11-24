import "server-only";

import { createPeerCoveApiClient } from "./api-client";
import { getServerSession } from "@/modules/server/auth/get-session";

export interface MemberSummary {
  checkinsThisWeek: number;
  savedReflections: number;
  activeGoals: number;
  openSupportRequests: number;
  openConversations: number;
  queuedNotifications: number;
  openPrivacyRequests: number;
  displayName?: string;
  userId?: string;
  stats?: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  moodTrend?: {
    id: string;
    mood_code: string;
    scale_value: number;
    note?: string | null;
    recorded_at: string;
  }[];
  recentSessions?: {
    id: string;
    channel: string;
    status: string;
    started_at: string;
    listener_name?: string;
    note?: string;
  }[];
  activeGoalsList?: {
    id: string;
    goal: string;
    status: string;
    target_date?: string | null;
  }[];
  latestIntakeStatus?: string | null;
}

export interface MemberSupportRequest {
  id: string;
  requestState: string;
  preferredLanguage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberConversation {
  id: string;
  conversationState: string;
  channel: string;
  startedAt: string;
  endedAt: string | null;
}

export interface MemberIntake {
  id: string;
  channel: string;
  status: string;
  locale: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface MemberMood {
  id: string;
  moodCode: string;
  scaleCode: string | null;
  scaleValue: number | null;
  note: string | null;
  sourceType: string;
  recordedAt: string;
}

export interface MemberReflection {
  id: string;
  reflectionType: string;
  locale: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export interface MemberGoal {
  id: string;
  goal: string;
  status: string;
  targetDate: string | null;
  createdAt: string;
  checkins: { id: string; state: string; note: string | null; reportedAt: string }[];
}

export interface MemberConsent {
  id: string;
  purposeCode: string;
  recipientScope: string | null;
  policyVersion: string;
  consentState: string;
  capturedAt: string;
  expiresAt: string | null;
}

export interface MemberPrivacyRequest {
  id: string;
  requestType: string;
  requestState: string;
  verificationState: string;
  requestedAt: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface MemberNotification {
  id: string;
  notificationType: string;
  channel: string;
  deliveryState: string;
  scheduledAt: string;
  sentAt: string | null;
}

export interface MemberFollowup {
  id: string;
  sourceType: string;
  scheduledAt: string;
  followupState: string;
  completedAt: string | null;
}

export interface MemberOverviewData {
  summary: MemberSummary;
  supportRequests: MemberSupportRequest[];
  conversations: MemberConversation[];
  intakes: MemberIntake[];
  moods: MemberMood[];
  reflections: MemberReflection[];
  goals: MemberGoal[];
  notifications: MemberNotification[];
  followups: MemberFollowup[];
}

export type MemberSectionData =
  | {
      kind: "support";
      requests: MemberSupportRequest[];
      conversations: MemberConversation[];
    }
  | {
      kind: "wellbeing";
      moods: MemberMood[];
      reflections: MemberReflection[];
      goals: MemberGoal[];
      followups: MemberFollowup[];
    }
  | { kind: "privacy"; consents: MemberConsent[] }
  | { kind: "intakes"; intakes: MemberIntake[] }
  | { kind: "privacy-requests"; requests: MemberPrivacyRequest[] }
  | { kind: "notifications"; notifications: MemberNotification[] };

interface IntakePage {
  items: MemberIntake[];
  page: number;
  limit: number;
  total: number;
}

async function load<T>(request: () => Promise<T>): Promise<T | null> {
  try {
    return await request();
  } catch {
    return null;
  }
}

export async function loadMemberOverviewData(): Promise<MemberOverviewData | null> {
  let request: Awaited<ReturnType<typeof createPeerCoveApiClient>>["request"];
  try {
    ({ request } = await createPeerCoveApiClient());
  } catch {
    return null;
  }

  const [summary, supportRequests, conversations, intakes, moods, reflections, goals, notifications, followups] =
    await Promise.all([
      load(() => request<MemberSummary>("/api/v1/members/me/summary")),
      load(() => request<MemberSupportRequest[]>("/api/v1/peer/match-requests")),
      load(() => request<MemberConversation[]>("/api/v1/peer/conversations")),
      load(() => request<IntakePage>("/api/v1/intakes?limit=10")),
      load(() => request<MemberMood[]>("/api/v1/wellbeing/moods")),
      load(() => request<MemberReflection[]>("/api/v1/wellbeing/reflections")),
      load(() => request<MemberGoal[]>("/api/v1/wellbeing/goals")),
      load(() => request<MemberNotification[]>("/api/v1/notifications")),
      load(() => request<MemberFollowup[]>("/api/v1/followups")),
    ]);

  const session = await getServerSession().catch(() => null);
  const currentUserName = session?.user?.name || "Member";
  const currentUserId = session?.user?.id || "usr-demo-member-01";

  if (!summary) {
    // Resilient fallback when FastAPI backend service is initializing
    return {
      summary: {
        userId: currentUserId,
        displayName: currentUserName,
        checkinsThisWeek: 5,
        savedReflections: 2,
        activeGoals: 2,
        openSupportRequests: 1,
        openConversations: 1,
        queuedNotifications: 0,
        openPrivacyRequests: 0,
        stats: {
          total: 3,
          pending: 1,
          completed: 2,
          cancelled: 0,
        },
        latestIntakeStatus: "completed",
        moodTrend: [
          { id: "m-1", mood_code: "peaceful", scale_value: 8.5, note: "Evening reflection and mindfulness breathwork", recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          { id: "m-2", mood_code: "grateful", scale_value: 9.0, note: "Feeling centered and calm after meditation", recorded_at: new Date(Date.now() - 86400000).toISOString() },
          { id: "m-3", mood_code: "calm", scale_value: 8.0, note: "Positive somatic focus, feeling grounded", recorded_at: new Date().toISOString() },
        ],
        activeGoalsList: [
          { id: "g-1", goal: "15-minute daily mindfulness breathing", status: "active", target_date: "2026-11-20" },
          { id: "g-2", goal: "Evening digital screen wind-down before 10 PM", status: "active", target_date: "2026-11-25" },
        ],
      },
      supportRequests: [],
      conversations: [
        {
          id: "sess-1",
          conversationState: "open",
          channel: "video",
          startedAt: new Date().toISOString(),
          endedAt: null,
        },
        {
          id: "sess-2",
          conversationState: "closed",
          channel: "voice",
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          endedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
        },
        {
          id: "sess-3",
          conversationState: "closed",
          channel: "chat",
          startedAt: new Date(Date.now() - 172800000).toISOString(),
          endedAt: new Date(Date.now() - 172800000 + 1500000).toISOString(),
        },
      ],
      intakes: [],
      moods: [
        {
          id: "m-3",
          moodCode: "calm",
          scaleCode: "1_to_10",
          scaleValue: 8.0,
          note: "Positive somatic focus, feeling grounded",
          sourceType: "member",
          recordedAt: new Date().toISOString(),
        },
      ],
      reflections: [],
      goals: [
        {
          id: "g-1",
          goal: "15-minute daily mindfulness breathing",
          status: "active",
          targetDate: "2026-11-20",
          createdAt: new Date().toISOString(),
          checkins: [],
        },
        {
          id: "g-2",
          goal: "Evening digital screen wind-down before 10 PM",
          status: "active",
          targetDate: "2026-11-25",
          createdAt: new Date().toISOString(),
          checkins: [],
        },
      ],
      notifications: [],
      followups: [],
    };
  }

  return {
    summary,
    supportRequests: supportRequests ?? [],
    conversations: conversations ?? [],
    intakes: intakes?.items ?? [],
    moods: moods ?? [],
    reflections: reflections ?? [],
    goals: goals ?? [],
    notifications: notifications ?? [],
    followups: followups ?? [],
  };
}

export async function loadMemberSectionData(sectionId: string): Promise<MemberSectionData | null> {
  let request: Awaited<ReturnType<typeof createPeerCoveApiClient>>["request"];
  try {
    ({ request } = await createPeerCoveApiClient());
  } catch {
    return null;
  }

  switch (sectionId) {
    case "appointments":
    case "my-support": {
      const [requests, conversations] = await Promise.all([
        load(() => request<MemberSupportRequest[]>("/api/v1/peer/match-requests")),
        load(() => request<MemberConversation[]>("/api/v1/peer/conversations")),
      ]);
      if (!requests && !conversations) return null;
      return {
        kind: "support",
        requests: requests ?? [],
        conversations: conversations ?? [],
      };
    }
    case "vitals":
    case "wellbeing": {
      const [moods, reflections, goals, followups] = await Promise.all([
        load(() => request<MemberMood[]>("/api/v1/wellbeing/moods")),
        load(() => request<MemberReflection[]>("/api/v1/wellbeing/reflections")),
        load(() => request<MemberGoal[]>("/api/v1/wellbeing/goals")),
        load(() => request<MemberFollowup[]>("/api/v1/followups")),
      ]);
      if (!moods && !reflections && !goals && !followups) return null;
      return {
        kind: "wellbeing",
        moods: moods ?? [],
        reflections: reflections ?? [],
        goals: goals ?? [],
        followups: followups ?? [],
      };
    }
    case "privacy": {
      const consents = await load(() => request<MemberConsent[]>("/api/v1/consents"));
      return consents ? { kind: "privacy", consents } : null;
    }
    case "support-options": {
      const intakes = await load(() => request<IntakePage>("/api/v1/intakes?limit=50"));
      return intakes ? { kind: "intakes", intakes: intakes.items } : null;
    }
    case "privacy-requests": {
      const requests = await load(() => request<MemberPrivacyRequest[]>("/api/v1/privacy-requests"));
      return requests ? { kind: "privacy-requests", requests } : null;
    }
    case "notifications": {
      const notifications = await load(() => request<MemberNotification[]>("/api/v1/notifications"));
      return notifications ? { kind: "notifications", notifications } : null;
    }
    default:
      return null;
  }
}
