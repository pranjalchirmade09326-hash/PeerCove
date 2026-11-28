import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileClock,
  Headphones,
  Heart,
  Inbox,
  Layers,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  MessagesSquare,
  Radio,
  Send,
  Settings2,
  ShieldCheck,
  Shield,
  Smile,
  Target,
  TriangleAlert,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type PeerCoveRoleId =
  | "member"
  | "listener"
  | "listener-supervisor"
  | "safety-operations"
  | "platform-administrator";

export type DashboardSection = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  columns: string[];
  rows: { values: string[]; status: string }[];
};

export type DashboardRole = {
  id: PeerCoveRoleId;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  welcome: string;
  summary: string;
  metrics: { label: string; value: string; note: string; icon: LucideIcon }[];
  activities: { title: string; detail: string; time: string }[];
  sections: DashboardSection[];
};

export const dashboardRoles: DashboardRole[] = [
  {
    id: "member",
    title: "Member",
    shortTitle: "Member",
    description: "A private space for wellbeing, reflection, and peer support.",
    icon: Heart,
    accent: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    welcome: "Your wellbeing space",
    summary: "Take things at your own pace. Choose a support option that feels right for you.",
    metrics: [
      { label: "Wellbeing check-ins", value: "3", note: "This week", icon: Activity },
      { label: "Saved reflections", value: "8", note: "Private to you", icon: BookOpen },
      { label: "Support conversations", value: "1", note: "In progress", icon: MessagesSquare },
    ],
    activities: [
      { title: "Weekly reflection", detail: "A private note is ready to continue.", time: "Today" },
      { title: "Listener match", detail: "Your support request is being reviewed.", time: "Yesterday" },
      { title: "Wellbeing check-in", detail: "You completed a short mood check-in.", time: "Mon" },
    ],
    sections: [
      {
        id: "chat",
        title: "Text Intake Chat",
        description: "Guided conversational text intake with streaming AI companion and encrypted transcript storage.",
        icon: MessagesSquare,
        columns: ["Session", "Channel", "Focus", "Status"],
        rows: [
          { values: ["Guided Wellbeing Intake", "Text Chat", "Stress & Reflection", "Ready"], status: "Available" },
        ],
      },
      {
        id: "voice",
        title: "Live Voice Intake",
        description: "Real-time voice conversation with live transcription, spoken replies, and encrypted intake summary.",
        icon: Headphones,
        columns: ["Session", "Channel", "Focus", "Status"],
        rows: [
          { values: ["Live Voice Sanctuary", "Voice Call", "Hands-Free Reflection", "Ready"], status: "Available" },
        ],
      },
      {
        id: "appointments",
        title: "Peer Sessions & Booking",
        description: "Schedule peer support sessions, book slots with verified volunteer listeners, and join online calls.",
        icon: CalendarDays,
        columns: ["Session", "Listener", "Format", "Scheduled Time"],
        rows: [
          { values: ["Work Burnout & Boundary Restoration", "Aarav Sharma", "Video Room", "Today, 6:30 PM"], status: "Upcoming" },
          { values: ["Managing Evening Anxiety", "Priya Nair", "Voice Room", "Nov 7, 5:00 PM"], status: "Completed" },
          { values: ["Relocation Stress & Grounding", "Kabir Mehta", "Text Chat", "Nov 4, 11:00 AM"], status: "Completed" },
        ],
      },
      {
        id: "medical-records",
        title: "Reflections & Reports",
        description: "Confidential post-session reflection summaries, intake evaluations, and personal wellbeing records.",
        icon: ClipboardCheck,
        columns: ["Record Title", "Type", "Listener / Evaluator", "Date"],
        rows: [
          { values: ["Post-Session Wellbeing & Boundary Review", "Session Reflection Summary", "Aarav Sharma", "Yesterday"], status: "Verified" },
          { values: ["Initial Multi-Modal Intake & Distress Screening", "Intake Triage Assessment", "PeerCove Care Navigator", "Nov 5"], status: "Verified" },
          { values: ["Grounding & Somatic Reflection Summary", "Somatic Reflection Note", "Priya Nair", "Nov 1"], status: "Verified" },
        ],
      },
      {
        id: "vitals",
        title: "Wellbeing Pulse",
        description: "Daily self-check-ins, calmness tracking, sleep duration, and emotional steady-state baselines.",
        icon: Activity,
        columns: ["Date", "Calmness Score", "Sleep", "Stress State"],
        rows: [
          { values: ["Today, 9:00 AM", "8/10 (Grounded)", "7.5 hrs", "Low / Stable"], status: "Logged" },
          { values: ["Yesterday, 10:30 PM", "6/10 (Neutral)", "6.8 hrs", "Moderate"], status: "Logged" },
          { values: ["Nov 6, 8:45 AM", "4/10 (Overwhelmed)", "5.5 hrs", "Elevated"], status: "Logged" },
        ],
      },
      {
        id: "consultation",
        title: "Peer Listening Rooms",
        description: "Join instant video rooms, voice listening calls, or confidential text dialogue rooms with verified listeners.",
        icon: Radio,
        columns: ["Room Format", "Availability", "Active Listeners", "Encryption"],
        rows: [
          { values: ["1-on-1 WebRTC Video Room", "Open Now", "2 Listeners On Duty", "E2EE Secure"], status: "Active" },
          { values: ["Audio / Voice Peer Session", "Open Now", "3 Listeners On Duty", "E2EE Secure"], status: "Active" },
          { values: ["Confidential Text Dialogue", "Open Now", "5 Listeners On Duty", "E2EE Secure"], status: "Active" },
        ],
      },
      {
        id: "mood",
        title: "Mood tracking",
        description: "Track your daily mood, emotional energy, triggers, and patterns over time.",
        icon: Smile,
        columns: ["Date", "Mood score", "Energy", "Tags", "Triggers"],
        rows: [
          { values: ["Today, 9:00 AM", "7/10 (Calm)", "Moderate", "Peaceful, Focused", "Morning walk"], status: "Logged" },
          { values: ["Yesterday, 8:30 PM", "5/10 (Neutral)", "Low", "Tired, Pensive", "Work deadline"], status: "Logged" },
          { values: ["Nov 3, 10:15 AM", "8/10 (Optimistic)", "High", "Grateful, Energetic", "Good sleep, Coffee"], status: "Logged" },
        ],
      },
      {
        id: "journal",
        title: "Journal",
        description: "A private space for daily reflections, guided prompts, and gratitude notes.",
        icon: BookOpen,
        columns: ["Title", "Prompt", "Word count", "Date"],
        rows: [
          { values: ["Finding grounding in uncertainty", "What helped you feel steady today?", "248 words", "Today, 11:20 AM"], status: "Private" },
          { values: ["Gratitude for small moments", "Three things you appreciated", "182 words", "Nov 2"], status: "Private" },
          { values: ["Reflecting on boundaries", "Freeform entry", "315 words", "Oct 30"], status: "Private" },
        ],
      },
      {
        id: "goals",
        title: "Goals",
        description: "Set, track, and celebrate small achievable wellbeing goals.",
        icon: Target,
        columns: ["Goal", "Category", "Streak", "Progress"],
        rows: [
          { values: ["10-minute mindful breathing", "Mindfulness", "5-day streak", "5/7 days this week"], status: "On track" },
          { values: ["Evening digital wind-down by 10 PM", "Sleep", "3-day streak", "4/7 days this week"], status: "On track" },
          { values: ["Daily 20-minute gentle walk", "Movement", "7-day streak", "7/7 days this week"], status: "Completed" },
        ],
      },
      {
        id: "profile",
        title: "Settings & Profile",
        description: "Confidential member identity, confidentiality preferences, and trusted support circle settings.",
        icon: Settings2,
        columns: ["Setting", "Value", "Status"],
        rows: [
          { values: ["Display Alias", "Member", "Active"], status: "Private" },
          { values: ["Listening Languages", "English, Hindi", "Set"], status: "Saved" },
          { values: ["Trusted Support Circle", "1 Contact", "Configured"], status: "Protected" },
        ],
      },
    ],
  },
  {
    id: "listener",
    title: "Listener",
    shortTitle: "Listener",
    description: "A workspace for trained, non-clinical peer support.",
    icon: Headphones,
    accent: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    welcome: "Listener workspace",
    summary: "Offer a warm, respectful conversation while keeping clear peer-support boundaries.",
    metrics: [
      { label: "Open conversations", value: "2", note: "One needs a reply", icon: MessagesSquare },
      { label: "Hours available", value: "4", note: "This week", icon: CalendarDays },
      { label: "Training progress", value: "80%", note: "One module remaining", icon: BookOpen },
    ],
    activities: [
      { title: "New support request", detail: "A member is looking for a conversation.", time: "12 min ago" },
      { title: "Conversation follow-up", detail: "A check-in reminder is scheduled.", time: "Yesterday" },
      { title: "Boundaries refresher", detail: "Continue your learning module.", time: "This week" },
    ],
    sections: [
      {
        id: "consultations",
        title: "Consultations & Live Queue",
        description: "Accept incoming member requests, start live consultation calls, review intake context, and document SOAP notes.",
        icon: CalendarDays,
        columns: ["Member", "Focus Topic", "Format", "Scheduled Slot"],
        rows: [
          { values: ["Ananya", "Work anxiety & feeling overwhelmed", "Video Room", "Today, 6:30 PM"], status: "Waiting" },
          { values: ["Rohan", "Exam stress & disrupted sleep cycle", "Text Chat", "Today, 7:15 PM"], status: "Confirmed" },
          { values: ["Simran", "Relocation stress & emotional isolation", "Voice Room", "Today, 8:00 PM"], status: "Confirmed" },
        ],
      },
      {
        id: "members",
        title: "Member Records & SOAP",
        description: "Review past encounter histories, distress progression, and confidential post-session SOAP documentation.",
        icon: ClipboardCheck,
        columns: ["Member Alias", "Encounters", "Last Session", "Distress Tier"],
        rows: [
          { values: ["Ananya", "3 Encounters", "Today", "Tier 1: Mild Distress"], status: "Documented" },
          { values: ["Rohan", "2 Encounters", "Nov 6", "Tier 1: Mild Distress"], status: "Documented" },
          { values: ["Simran", "4 Encounters", "Nov 3", "Tier 2: Moderate Work Stress"], status: "Documented" },
        ],
      },
      {
        id: "profile",
        title: "Practice Profile & Settings",
        description: "Manage your verified peer listener level, languages, focus specialties, and concurrent roster capacity.",
        icon: UserCheck,
        columns: ["Setting", "Value", "Status"],
        rows: [
          { values: ["Listener Credentials", "Level 2 Certified Peer Specialist", "Verified"], status: "Active" },
          { values: ["Active Queue Dispatch", "Available to Listen", "Online"], status: "Live" },
          { values: ["Concurrent Member Limit", "Max 3 Members", "Enforced"], status: "Healthy" },
        ],
      },
    ],
  },
  {
    id: "listener-supervisor",
    title: "Listener supervisor",
    shortTitle: "Supervisor",
    description: "Support listener readiness, workload, and quality practices.",
    icon: UsersRound,
    accent: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    welcome: "Listener supervision",
    summary: "Help listeners deliver safe, consistent peer support with clear boundaries.",
    metrics: [
      { label: "Active listeners", value: "18", note: "Across the program", icon: UsersRound },
      { label: "Reviews due", value: "4", note: "This week", icon: ClipboardCheck },
      { label: "Training follow-ups", value: "3", note: "Need attention", icon: BookOpen },
    ],
    activities: [
      { title: "Readiness review", detail: "Two listener check-ins are due this week.", time: "Today" },
      { title: "Training follow-up", detail: "A boundaries module needs review.", time: "Yesterday" },
      { title: "Workload overview", detail: "One listener is nearing their weekly limit.", time: "Monday" },
    ],
    sections: [
      {
        id: "listeners",
        title: "Pod Roster & Eligibility",
        description: "Review volunteer listener readiness, workload capacity, and manage active eligibility status (US-031).",
        icon: UsersRound,
        columns: ["Listener", "Readiness", "Capacity"],
        rows: [
          { values: ["Aarav Sharma", "Fully Certified", "1 of 3 Capacity"], status: "Eligible" },
          { values: ["Priya Nair", "Fully Certified", "2 of 2 Capacity"], status: "Eligible" },
          { values: ["Kabir Das", "Annual Review Due", "0 of 1 Capacity"], status: "Review Due" },
          { values: ["Meera Rao", "Training Suspended", "0 of 1 Capacity"], status: "Suspended" },
        ],
      },
      {
        id: "conduct-reports",
        title: "Conduct & Boundary Audits",
        description: "Review member-reported boundary concerns, audit flagged encounters, and record supervisor resolution decisions (US-031).",
        icon: TriangleAlert,
        columns: ["Report", "Category", "Opened"],
        rows: [
          { values: ["CR-054 · Aarav Sharma", "Boundary Caution (Sleep advice)", "Today, 8:40 AM"], status: "In Review" },
          { values: ["CR-049 · Kabir Das", "Communication Style", "Yesterday"], status: "Resolved" },
        ],
      },
      {
        id: "training-reviews",
        title: "Training Signoffs & Pods",
        description: "Audit CEU module completions, sign off Safeguarding V2 credentials, and manage supervision pod schedules (US-018 / US-031).",
        icon: BookOpen,
        columns: ["Listener", "Module", "Due"],
        rows: [
          { values: ["Kabir Das", "PC-BE-201 · Peer Boundaries", "Signoff Pending"], status: "Due Soon" },
          { values: ["Meera Rao", "PC-SS-202 · Crisis Alerting", "Signoff Pending"], status: "Review Due" },
          { values: ["Monthly Pod Check-in", "All Supervised Listeners", "Nov 24, 2026"], status: "Scheduled" },
        ],
      },
    ],
  },
  {
    id: "safety-operations",
    title: "Safety operations specialist",
    shortTitle: "Safety operations",
    description: "Review assigned safety cases and coordinate human handoffs.",
    icon: LifeBuoy,
    accent: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    welcome: "Safety operations",
    summary: "Work only on assigned cases using approved human-led safety procedures.",
    metrics: [
      { label: "Assigned cases", value: "3", note: "Review promptly", icon: ShieldCheck },
      { label: "Handoffs pending", value: "1", note: "Needs coordination", icon: Radio },
      { label: "Follow-ups due", value: "2", note: "Today", icon: CalendarDays },
    ],
    activities: [
      { title: "Assigned case", detail: "A human review is waiting in your queue.", time: "8 min ago" },
      { title: "Handoff follow-up", detail: "Confirm the approved contact pathway.", time: "Today" },
      { title: "Procedure reminder", detail: "Use the current reviewed safety guidance.", time: "This week" },
    ],
    sections: [
      {
        id: "case-queue",
        title: "Assigned case queue",
        description: "Only handle cases assigned to you and follow approved operational procedures.",
        icon: ShieldCheck,
        columns: ["Case", "Priority", "Assigned at"],
        rows: [
          { values: ["Case S-204", "Needs review", "Today, 9:42 AM"], status: "Assigned" },
          { values: ["Case S-198", "Follow-up", "Yesterday"], status: "Assigned" },
        ],
      },
      {
        id: "handoffs",
        title: "Human handoffs",
        description: "Coordinate human handoffs using approved, staffed pathways only.",
        icon: Radio,
        columns: ["Handoff", "Pathway", "Next step"],
        rows: [
          { values: ["Handoff H-051", "Approved local support resource", "Confirm connection"], status: "Pending" },
        ],
      },
      {
        id: "resources",
        title: "Safety resources",
        description: "Reference reviewed local resources and escalation procedures.",
        icon: LifeBuoy,
        columns: ["Resource", "Coverage", "Review date"],
        rows: [
          { values: ["Local support directory", "Configured region", "Nov 1"], status: "Reviewed" },
          { values: ["Internal escalation guide", "Staffed hours only", "Oct 28"], status: "Reviewed" },
        ],
      },
      {
        id: "case-actions",
        title: "Case actions",
        description: "Timestamped human actions recorded against a case. Free-text notes stay encrypted.",
        icon: ListChecks,
        columns: ["Case", "Action", "Recorded"],
        rows: [
          { values: ["Case S-204", "Contact pathway confirmed", "Today, 10:05 AM"], status: "Completed" },
          { values: ["Case S-204", "Approved resource shared", "Today, 9:58 AM"], status: "Completed" },
          { values: ["Case S-198", "Follow-up scheduled", "Yesterday"], status: "Attempted" },
        ],
      },
      {
        id: "followups",
        title: "Safety follow-ups",
        description: "Scheduled wellbeing check-ins. Completion is not implied until a human records it.",
        icon: FileClock,
        columns: ["Follow-up", "Member", "Due"],
        rows: [
          { values: ["FU-311", "M-104", "Tomorrow, 11:00 AM"], status: "Scheduled" },
          { values: ["FU-307", "M-087", "Today, 4:00 PM"], status: "Due" },
        ],
      },
    ],
  },
  {
    id: "platform-administrator",
    title: "Platform administrator",
    shortTitle: "Administrator",
    description: "Manage platform operations while protecting private conversation content.",
    icon: Shield,
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    welcome: "Platform administration",
    summary: "Oversee service health, access, and audit activity with least-privilege access.",
    metrics: [
      { label: "Platform status", value: "Healthy", note: "All demo services", icon: Activity },
      { label: "Access reviews", value: "5", note: "Due this month", icon: ShieldCheck },
      { label: "Audit events", value: "24", note: "Last 24 hours", icon: ClipboardCheck },
    ],
    activities: [
      { title: "Access review due", detail: "Review a pending role assignment.", time: "Today" },
      { title: "Service status", detail: "All configured demo services are operational.", time: "Today" },
      { title: "Audit log", detail: "A role change was recorded.", time: "Yesterday" },
    ],
    sections: [
      {
        id: "users-roles",
        title: "Users & roles",
        description: "Manage account access and role assignments. Use least privilege.",
        icon: UsersRound,
        columns: ["Account", "Role", "Access review"],
        rows: [
          { values: ["listener@example.test", "Listener", "Due Nov 30"], status: "Active" },
          { values: ["safety@example.test", "Safety operations", "Reviewed Nov 1"], status: "Active" },
        ],
      },
      {
        id: "service-health",
        title: "Service health",
        description: "Review high-level platform availability without exposing private conversations.",
        icon: Activity,
        columns: ["Service", "Status", "Last checked"],
        rows: [
          { values: ["Authentication", "Operational", "Just now"], status: "Healthy" },
          { values: ["Peer support", "Operational", "Just now"], status: "Healthy" },
        ],
      },
      {
        id: "audit-log",
        title: "Audit log",
        description: "Review access and configuration events. Sensitive conversation content is excluded.",
        icon: ClipboardCheck,
        columns: ["Event", "Actor", "Time"],
        rows: [
          { values: ["Role assignment reviewed", "admin@example.test", "Today, 9:14 AM"], status: "Recorded" },
          { values: ["Service configuration updated", "admin@example.test", "Yesterday"], status: "Recorded" },
        ],
      },
      {
        id: "workflow-registry",
        title: "Workflow registry",
        description: "Versioned P01–P09 process definitions, executions, and human tasks.",
        icon: Layers,
        columns: ["Process", "Version", "State"],
        rows: [
          { values: ["P05 · Listener matching", "1.0.0", "Active"], status: "Running" },
          { values: ["P03 · Safety escalation", "1.1.0", "Active"], status: "Running" },
          { values: ["P08 · Privacy requests", "0.9.0", "Draft"], status: "Draft" },
        ],
      },
      {
        id: "notification-queue",
        title: "Notification queue",
        description: "Queued references only; delivery is not claimed until a provider confirms it.",
        icon: Bell,
        columns: ["Type", "Channel", "Scheduled"],
        rows: [
          { values: ["support_followup", "In-app", "Today, 4:00 PM"], status: "Queued" },
          { values: ["weekly_reflection", "Email", "Friday, 9:00 AM"], status: "Queued" },
        ],
      },
      {
        id: "self-help-content",
        title: "Self-help content",
        description: "Draft, review, and approve non-clinical self-help content versions.",
        icon: BookOpen,
        columns: ["Content", "Locale", "Review"],
        rows: [
          { values: ["Grounding basics v3", "en", "Approved · Nov 1"], status: "Published" },
          { values: ["Sleep routines v1", "hi", "Awaiting second reviewer"], status: "Draft" },
        ],
      },
      {
        id: "eventing",
        title: "Eventing & outbox",
        description: "Transactional outbox backlog and idempotent consumer receipts. Payloads stay minimized.",
        icon: Send,
        columns: ["Event", "Aggregate", "Occurred"],
        rows: [
          { values: ["peer.match.accepted v1", "listener_match", "2 min ago"], status: "Unpublished" },
          { values: ["safety.case.closed v1", "safety_case", "18 min ago"], status: "Published" },
        ],
      },
    ],
  },
];

export function getDashboardRole(roleId: string): DashboardRole | undefined {
  const normalizedId =
    roleId === "supervisor" || roleId === "listener_supervisor"
      ? "listener-supervisor"
      : roleId === "safety" || roleId === "safety_operations" || roleId === "safety_operations_specialist"
      ? "safety-operations"
      : roleId === "admin" || roleId === "platform_administrator"
      ? "platform-administrator"
      : roleId;
  return dashboardRoles.find((role) => role.id === normalizedId || role.id === roleId);
}
