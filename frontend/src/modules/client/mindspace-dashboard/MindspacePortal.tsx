import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Clock3,
  Database,
  MessageCircle,
  Mic,
  ShieldAlert,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  dashboardRoles,
  getDashboardRole,
  type DashboardRole,
  type DashboardSection,
} from "./dashboard-data";
export interface LiveDashboardData {
  live?: boolean;
  metrics?: Array<Record<string, any>>;
  sections?: Record<string, { columns: string[]; rows: Array<{ values: string[]; status?: string }> }>;
  [key: string]: any;
}
import { DemoRoleButtons } from "./DemoRoleButtons";
import {
  MemberDashboardView,
  MemberAppointmentsView,
  MemberRecordsView,
  MemberVitalsView,
  MemberConsultationView,
  MemberProfileView,
  MemberMoodView,
  MemberJournalView,
  MemberGoalsView,
  ListenerDashboardView,
  ListenerConsultationsView,
  ListenerMembersView,
  ListenerProfileView,
  AdminDashboardView,
  SupervisorDashboardView,
} from "@/modules/client/mindspace";
import { SafetyOperationsDashboardView } from "@/modules/client/mindspace/safety/components/SafetyOperationsDashboardView";

function DemoBanner({ live }: { live?: boolean }) {
  return null;
}

function WorkspaceBreadcrumb({
  role,
  section,
}: {
  role: DashboardRole;
  section?: DashboardSection;
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>MindSpace</span>
      <span aria-hidden="true">/</span>
      {section ? (
        <>
          <Link
            href={`/mindspace/${role.id}`}
            className="hover:text-foreground hover:underline transition-colors"
          >
            {role.shortTitle}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-foreground">{section.title}</span>
        </>
      ) : (
        <span className="font-medium text-foreground">{role.shortTitle}</span>
      )}
    </nav>
  );
}

function PortalHeader({
  role,
  section,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  section?: DashboardSection;
}) {
  if (section) return null;
  const Icon = role.icon;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`flex size-11 items-center justify-center rounded-2xl ${role.accent}`}>
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                MindSpace Connected Care
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {role.welcome}
              </h1>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            {role.summary}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CircleCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
            {role.shortTitle} Active
          </Badge>
        </div>
      </div>
    </div>
  );
}

function DashboardHome({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  // Live metrics replace sample values but keep the role's icon set; any
  // metric slot the API did not fill falls back to the sample metric.
  const metrics = live?.metrics?.length
    ? role.metrics.map((metric, index) => ({
        ...metric,
        ...(live.metrics![index] ?? {}),
      }))
    : role.metrics;
  const activities = live?.activities?.length ? live.activities : role.activities;

  return (
    <>
      <PortalHeader role={role} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="gap-3">
              <CardHeader className="flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-2xl">{metric.value}</CardTitle>
                </div>
                <span className={`rounded-xl p-2 ${role.accent}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{metric.note}</CardContent>
            </Card>
          );
        })}
      </div>


      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        {role.id !== "safety-operations" && role.id !== "platform-administrator" && (
          <Card>
            <CardHeader>
              <CardTitle>Operational Modules</CardTitle>
              <CardDescription>Direct access to your {role.shortTitle.toLowerCase()} services and features.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {role.sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    href={`/mindspace/${role.id}/${section.id}`}
                    className="group rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-lg p-2 ${role.accent}`}>
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <ArrowRight
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                    <h2 className="mt-4 font-medium">{section.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Illustrative activity for this role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {activities.map((activity: any, index: number) => (
              <div key={`${activity.title}-${activity.time}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 size-2.5 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  {index < activities.length - 1 && <span className="mt-1 h-full min-h-7 w-px bg-border" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{activity.title}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {activity.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{activity.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {role.id === "safety-operations" && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            Safety workflows shown here are sample-only. They do not provide
            emergency dispatch or imply that human support is staffed.
          </p>
        </div>
      )}
      {role.id === "platform-administrator" && (
        <p className="text-sm text-muted-foreground">
          Administrator access is designed to avoid default access to private conversation content.
        </p>
      )}
      {(role.id as string) === "ai-agent" && (
        <p className="text-sm text-muted-foreground">
          AI service identities are non-human principals limited to authorized typed tools, with no direct database access.
        </p>
      )}
    </>
  );
}

function SectionPage({
  role,
  section,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  section: DashboardSection;
  live?: LiveDashboardData | null;
}) {
  // Authentic MindSpace Member workflows
  if (role.id === "member") {
    if (section.id === "mood") {
      return <MemberMoodView />;
    }
    if (section.id === "journal") {
      return <MemberJournalView />;
    }
    if (section.id === "goals") {
      return <MemberGoalsView />;
    }
    if (section.id === "my-support" || section.id === "appointments") {
      return <MemberAppointmentsView />;
    }
    if (section.id === "wellbeing" || section.id === "vitals") {
      return <MemberVitalsView />;
    }
    if (section.id === "medical-records") {
      return <MemberRecordsView />;
    }
    if (section.id === "consultation") {
      return <MemberConsultationView />;
    }
    if (section.id === "profile") {
      return <MemberProfileView />;
    }
  }

  // MindSpace Peer Listener workflows
  if (role.id === "listener") {
    if (section.id === "consultations") {
      return <ListenerConsultationsView />;
    }
    if (section.id === "members") {
      return <ListenerMembersView />;
    }
    if (section.id === "profile") {
      return <ListenerProfileView />;
    }
  }

  // Remapped Telemedicine Admin -> MindSpace Supervisor, Safety & Platform Admin workflows
  if (role.id === "listener-supervisor") {
    return (
      <SupervisorDashboardView
        sectionId={section.id}
        sectionTitle={section.title}
        sectionDescription={section.description}
      />
    );
  }

  if (role.id === "safety-operations") {
    return <SafetyOperationsDashboardView />;
  }

  if (role.id === "platform-administrator") {
    return <AdminDashboardView />;
  }

  // When the API returned rows for this section they replace the sample
  // table; otherwise the sample preview remains visible.
  const override = live?.sections?.[section.id];
  const columns = override?.columns ?? section.columns;
  const rows = override?.rows ?? section.rows;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        <CardDescription>
          {section.description}
        </CardDescription>
      </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="hidden gap-4 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
          >
            {columns.map((column: string) => <span key={column}>{column}</span>)}
            <span>Status</span>
          </div>
          {rows.map((row: any, index: number) => (
            <div
              key={`${section.id}-${index}`}
              className="grid gap-3 rounded-xl border p-4 md:items-center md:gap-4"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
            >
              {row.values.map((value: string, valueIndex: number) => (
                <div key={`${section.id}-${index}-${valueIndex}`} className="min-w-0">
                  <p className="text-xs text-muted-foreground md:hidden">{columns[valueIndex]}</p>
                  <p className="break-words text-sm">{value}</p>
                </div>
              ))}
              <Badge variant="secondary" className="w-fit">{row.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
  );
}

function AuthRequired({ role }: { role: { title: string; shortTitle: string } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in required</CardTitle>
        <CardDescription>
          The {role.shortTitle} dashboard shows live records from your MindSpace
          account. Sign in to continue — sample data is not shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

function RoleWorkspaceLayout({
  role,
  activeSectionId,
  currentSection,
  live,
  children,
}: {
  role: DashboardRole;
  activeSectionId?: string;
  currentSection?: DashboardSection;
  live?: LiveDashboardData | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 py-2">
      <DemoBanner live={live?.live} />
      <WorkspaceBreadcrumb role={role} section={currentSection} />

      {/* Dedicated main content area (full width) */}
      <div className="space-y-6 min-w-0 w-full">{children}</div>
    </div>
  );
}

function MemberDashboard({
  role,
  live,
  overviewData,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
  overviewData?: any;
}) {
  const memberData = overviewData?.data;
  const userName = memberData?.summary?.displayName || "Member Sanctuary User";
  const stats = memberData?.summary?.stats;

  return (
    <RoleWorkspaceLayout role={role} activeSectionId="overview" live={live}>
      <MemberDashboardView
        userName={userName}
        stats={stats}
        initialData={memberData}
      />
    </RoleWorkspaceLayout>
  );
}

function ListenerDashboard({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  return (
    <RoleWorkspaceLayout role={role} activeSectionId="overview" live={live}>
      <ListenerDashboardView />
    </RoleWorkspaceLayout>
  );
}

function AdminDashboard({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  return (
    <RoleWorkspaceLayout role={role} activeSectionId="overview" live={live}>
      <AdminDashboardView />
    </RoleWorkspaceLayout>
  );
}

function SupervisorDashboard({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  return (
    <RoleWorkspaceLayout role={role} activeSectionId="overview" live={live}>
      <SupervisorDashboardView />
    </RoleWorkspaceLayout>
  );
}

function SafetyDashboard({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  return (
    <RoleWorkspaceLayout role={role} activeSectionId="overview" live={live}>
      <SafetyOperationsDashboardView />
    </RoleWorkspaceLayout>
  );
}

function GenericRoleDashboard({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  return (
    <RoleWorkspaceLayout role={role} activeSectionId="overview" live={live}>
      <DashboardHome role={role} live={live} />
    </RoleWorkspaceLayout>
  );
}

export function MindspaceRoleDashboard({
  roleId,
  live,
  overviewData,
}: {
  roleId: string;
  live?: LiveDashboardData | null;
  overviewData?: any;
}) {
  const role = getDashboardRole(roleId);
  if (!role) notFound();

  // Live fetch was attempted and failed (no session / API unreachable) —
  // show a sign-in prompt instead of sample records.
  if (live && !live.live) {
    return (
      <RoleWorkspaceLayout role={role} activeSectionId="overview" live={live}>
        <PortalHeader role={role} />
        <AuthRequired role={role} />
      </RoleWorkspaceLayout>
    );
  }

  // Dedicated Clean Architecture layouts per role:
  if (role.id === "member") {
    return <MemberDashboard role={role} live={live} overviewData={overviewData} />;
  }

  if (role.id === "listener") {
    return <ListenerDashboard role={role} live={live} />;
  }

  if (role.id === "platform-administrator") {
    return <AdminDashboard role={role} live={live} />;
  }

  if (role.id === "listener-supervisor") {
    return <SupervisorDashboard role={role} live={live} />;
  }

  if (role.id === "safety-operations") {
    return <SafetyDashboard role={role} live={live} />;
  }

  return <GenericRoleDashboard role={role} live={live} />;
}

export function MindspaceRoleSection({
  roleId,
  sectionId,
  live,
  sectionData,
}: {
  roleId: string;
  sectionId: string;
  live?: LiveDashboardData | null;
  sectionData?: any;
}) {
  const role = getDashboardRole(roleId);
  const section = role?.sections.find((item) => item.id === sectionId);
  if (!role || !section) notFound();

  if (live && !live.live) {
    return (
      <RoleWorkspaceLayout
        role={role}
        activeSectionId={sectionId}
        currentSection={section}
        live={live}
      >
        <AuthRequired role={role} />
      </RoleWorkspaceLayout>
    );
  }

  return (
    <RoleWorkspaceLayout
      role={role}
      activeSectionId={sectionId}
      currentSection={section}
      live={live}
    >
      <SectionPage role={role} section={section} live={live} />
    </RoleWorkspaceLayout>
  );
}

export function MindspaceWorkspaceIndex() {
  return (
    <div className="space-y-6 py-2">
      <DemoBanner />

      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">MindSpace role workspaces</p>
        <h1 className="text-3xl font-semibold tracking-tight">Choose a workspace</h1>
        <p className="max-w-3xl text-muted-foreground">
          A starting structure for each product role. Choose a dashboard to preview its pages and sample data.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardRoles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <span className={`mb-2 flex size-11 items-center justify-center rounded-2xl ${role.accent}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle>{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {role.sections.length} operational modules
                </span>
                <Link
                  href={`/mindspace/${role.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Open dashboard
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border border-emerald-100 dark:border-emerald-950/40 shadow-sm bg-card/60 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected Role Launchpad
          </CardTitle>
          <CardDescription>
            Quickly switch between Member, Volunteer Peer Listener, Supervisor, Safety Operations, and Platform Admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemoRoleButtons />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>Protected by 24/7 Clinical Safety Sentinel & AES-256-GCM Envelope Encryption</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-medium">MindSpace Platform v1.0</span>
      </div>
    </div>
  );
}
