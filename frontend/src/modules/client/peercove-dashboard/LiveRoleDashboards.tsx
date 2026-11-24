import {
  Activity,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileClock,
  Headphones,
  Inbox,
  LifeBuoy,
  ListChecks,
  MessagesSquare,
  Radio,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ConductReport,
  CrisisResource,
  ListenerAvailability,
  ListenerOffer,
  ListenerOverviewData,
  ListenerProfile,
  ListenerSectionData,
  ListenerTrainingRecord,
  PeerConversation,
  SafetyCase,
  SafetyFollowup,
  SafetyOverviewData,
  SafetySectionData,
  SupervisorAssignment,
  SupervisorListener,
  SupervisorOverviewData,
  SupervisorSectionData,
} from "@/modules/server/peercove/role-dashboards";
import {
  EmptyState,
  ListRow,
  MetricCard,
  SectionRow,
  SectionTable,
  StateBadge,
  formatWhen,
  formatWindow,
  humanize,
} from "./dashboard-ui";

function shortId(value: string) {
  if (value.startsWith("usr-")) {
    return value
      .slice(4)
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  const tail = value.split("-").at(-1) ?? value;
  const trimmed = tail.replace(/^0+/, "");
  return (trimmed || tail).toUpperCase();
}

function listenerName(listeners: SupervisorListener[], listenerId: string) {
  return listeners.find((listener) => listener.listenerProfileId === listenerId)?.displayName ?? `Listener ${shortId(listenerId)}`;
}

function ConversationsCard({ conversations }: { conversations: PeerConversation[] }) {
  const recent = conversations.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversations</CardTitle>
        <CardDescription>Peer-support conversations assigned to you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No conversations yet" description="Accepted offers will open a conversation here." />
        ) : (
          recent.map((conversation) => (
            <ListRow
              key={conversation.id}
              title={`${humanize(conversation.channel)} conversation · ${shortId(conversation.id)}`}
              meta={`Member ${shortId(conversation.memberId)} · started ${formatWhen(conversation.startedAt)}`}
              state={conversation.conversationState}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function OffersCard({ offers }: { offers: ListenerOffer[] }) {
  const recent = offers.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support offers</CardTitle>
        <CardDescription>Matching offers waiting for your response.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No open offers" description="New matching offers will appear here." />
        ) : (
          recent.map((offer) => (
            <ListRow
              key={offer.id}
              title={`Offer · ${shortId(offer.requestId)}`}
              meta={offer.request.preferredLanguages.length ? offer.request.preferredLanguages.join(", ").toUpperCase() : "Language not specified"}
              state={offer.matchState}
              trailing={formatWhen(offer.offeredAt)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ListenerTrainingCard({ training }: { training: ListenerTrainingRecord[] }) {
  const recent = training.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training</CardTitle>
        <CardDescription>Required learning and current completion state.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No training records" description="Assigned modules will appear here." />
        ) : (
          recent.map((record) => (
            <ListRow
              key={record.id}
              title={humanize(record.moduleCode)}
              meta={`Version ${record.moduleVersion}${record.expiresAt ? ` · expires ${formatWhen(record.expiresAt)}` : ""}`}
              state={record.completionState}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AvailabilityCard({ availability }: { availability: ListenerAvailability[] }) {
  const upcoming = availability.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
        <CardDescription>Your upcoming availability windows.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <EmptyState title="No availability set" description="Add availability windows so matching can find you." />
        ) : (
          upcoming.map((interval) => (
            <ListRow
              key={interval.id}
              title={formatWindow(interval.startsAt, interval.endsAt)}
              meta={interval.timezone}
              state={interval.availabilityState}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ApplicationCard({ profile }: { profile: ListenerProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application & eligibility</CardTitle>
        <CardDescription>Your profile, languages, and current capacity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ListRow title="Listener application" meta={profile.profileLanguages.join(", ").toUpperCase() || "No languages added"} state={profile.applicationState} />
        <ListRow
          title="Eligibility"
          meta={profile.eligibilityExpiresAt ? `Expires ${formatWhen(profile.eligibilityExpiresAt)}` : "No expiry recorded"}
          state={profile.eligibilityState}
        />
        <ListRow title="Weekly capacity" meta={`${profile.capacityLimit} conversations`} state="active" />
        <ListRow title="Approved" meta={profile.approvedAt ? formatWhen(profile.approvedAt) : "Not approved yet"} state={profile.applicationState} />
      </CardContent>
    </Card>
  );
}

export function ListenerOverview({ data }: { data: ListenerOverviewData }) {
  const { summary } = data;
  const metrics = [
    { label: "Open conversations", value: summary.openConversations, note: "Active peer support", icon: MessagesSquare },
    { label: "Open offers", value: summary.openOffers, note: "Waiting for your reply", icon: Inbox },
    { label: "Available hours", value: summary.availableHoursThisWeek, note: "This week", icon: CalendarDays },
    { label: "Training passed", value: summary.passedTraining, note: `${summary.trainingRecords} total records`, icon: BookOpen },
    { label: "Weekly capacity", value: summary.capacityLimit, note: "Conversations you accept", icon: Headphones },
    { label: "Scheduled follow-ups", value: summary.scheduledFollowups, note: "Wellbeing check-ins", icon: FileClock },
    { label: "Application", value: humanize(summary.applicationState), note: "Listener profile", icon: ClipboardCheck },
    { label: "Eligibility", value: humanize(summary.eligibilityState), note: "Current standing", icon: ShieldCheck },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ConversationsCard conversations={data.conversations} />
        <OffersCard offers={data.offers} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ListenerTrainingCard training={data.training} />
        <AvailabilityCard availability={data.availability} />
      </div>
      {data.profile && <ApplicationCard profile={data.profile} />}
    </>
  );
}

export function ListenerSection({ data }: { data: ListenerSectionData }) {
  switch (data.kind) {
    case "conversations":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Manage assigned peer-support conversations. These are not therapy sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.conversations.length === 0 ? (
              <EmptyState title="No conversations yet" description="Accepted offers will open a conversation here." />
            ) : (
              <SectionTable columns={["Conversation", "Member", "Started"]}>
                {data.conversations.map((conversation) => (
                  <SectionRow
                    key={conversation.id}
                    columns={["Conversation", "Member", "Started"]}
                    values={[
                      `${humanize(conversation.channel)} · ${shortId(conversation.id)}`,
                      shortId(conversation.memberId),
                      formatWhen(conversation.startedAt),
                    ]}
                    state={conversation.conversationState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "training":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Training</CardTitle>
            <CardDescription>Review required learning and your current completion state.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.training.length === 0 ? (
              <EmptyState title="No training records" description="Assigned modules will appear here." />
            ) : (
              <SectionTable columns={["Module", "Version", "Completed", "Expires"]}>
                {data.training.map((record) => (
                  <SectionRow
                    key={record.id}
                    columns={["Module", "Version", "Completed", "Expires"]}
                    values={[
                      humanize(record.moduleCode),
                      record.moduleVersion,
                      record.completedAt ? formatWhen(record.completedAt) : "—",
                      record.expiresAt ? formatWhen(record.expiresAt) : "—",
                    ]}
                    state={record.completionState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "availability":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>The times you may be available for peer-support requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.availability.length === 0 ? (
              <EmptyState title="No availability set" description="Add availability windows so matching can find you." />
            ) : (
              <SectionTable columns={["Window", "Timezone"]}>
                {data.availability.map((interval) => (
                  <SectionRow
                    key={interval.id}
                    columns={["Window", "Timezone"]}
                    values={[formatWindow(interval.startsAt, interval.endsAt), interval.timezone]}
                    state={interval.availabilityState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "offers":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Support offers</CardTitle>
            <CardDescription>Respond to matching offers. Accepting is voluntary and requires current eligibility.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.offers.length === 0 ? (
              <EmptyState title="No open offers" description="New matching offers will appear here." />
            ) : (
              <SectionTable columns={["Offer", "Languages", "Offered", "Expires"]}>
                {data.offers.map((offer) => (
                  <SectionRow
                    key={offer.id}
                    columns={["Offer", "Languages", "Offered", "Expires"]}
                    values={[
                      shortId(offer.requestId),
                      offer.request.preferredLanguages.join(", ").toUpperCase() || "—",
                      formatWhen(offer.offeredAt),
                      offer.request.expiresAt ? formatWhen(offer.request.expiresAt) : "—",
                    ]}
                    state={offer.matchState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "application":
      return <ApplicationCard profile={data.profile} />;
    case "feedback": {
      const completed = data.conversations.filter((conversation) => conversation.conversationState !== "open");
      return (
        <Card>
          <CardHeader>
            <CardTitle>Feedback summary</CardTitle>
            <CardDescription>Aggregated member feedback without exposing private conversation content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completed.length === 0 ? (
              <EmptyState
                title="No completed conversations yet"
                description="Member feedback summaries appear once a conversation closes."
              />
            ) : (
              <>
                <SectionTable columns={["Conversation", "Channel", "Closed"]}>
                  {completed.map((conversation) => (
                    <SectionRow
                      key={conversation.id}
                      columns={["Conversation", "Channel", "Closed"]}
                      values={[
                        `Conversation · ${shortId(conversation.id)}`,
                        humanize(conversation.channel),
                        conversation.endedAt ? formatWhen(conversation.endedAt) : "—",
                      ]}
                      state={conversation.conversationState}
                    />
                  ))}
                </SectionTable>
                <p className="text-sm text-muted-foreground">
                  {completed.length} closed conversation{completed.length === 1 ? "" : "s"} eligible for member
                  feedback. Detailed summaries are reviewed with your supervisor.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      );
    }
  }
}

function RosterCard({ listeners }: { listeners: SupervisorListener[] }) {
  const recent = listeners.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Listener roster</CardTitle>
        <CardDescription>Readiness and current workload at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No listeners yet" description="Approved listeners will appear here." />
        ) : (
          recent.map((listener) => (
            <ListRow
              key={listener.listenerProfileId}
              title={listener.displayName ?? listener.userId}
              meta={`${humanize(listener.eligibilityState)} · ${listener.openConversations}/${listener.capacityLimit} conversations`}
              state={listener.applicationState}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ConductCard({ reports }: { reports: ConductReport[] }) {
  const recent = reports.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conduct reports</CardTitle>
        <CardDescription>Member-raised concerns awaiting review.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No conduct reports" description="New reports will appear here." />
        ) : (
          recent.map((report) => (
            <ListRow
              key={report.id}
              title={humanize(report.categoryCode)}
              meta={`Report ${shortId(report.id)} · conversation ${shortId(report.conversationId)}`}
              state={report.reportState}
              trailing={formatWhen(report.createdAt)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SupervisorTrainingCard({
  training,
  listeners,
}: {
  training: ListenerTrainingRecord[];
  listeners: SupervisorListener[];
}) {
  const recent = training.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training reviews</CardTitle>
        <CardDescription>Required learning across the listener roster.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No training records" description="Training assignments will appear here." />
        ) : (
          recent.map((record) => (
            <ListRow
              key={record.id}
              title={humanize(record.moduleCode)}
              meta={`${listenerName(listeners, record.listenerId)} · version ${record.moduleVersion}`}
              state={record.completionState}
              trailing={record.completedAt ? formatWhen(record.completedAt) : "Not completed"}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function SupervisorOverview({ data }: { data: SupervisorOverviewData }) {
  const { summary } = data;
  const metrics = [
    { label: "Active listeners", value: summary.activeListeners, note: "Approved and eligible", icon: UsersRound },
    { label: "Pending applications", value: summary.pendingApplications, note: "Awaiting a decision", icon: ClipboardCheck },
    { label: "Training due", value: summary.trainingDue, note: "Assigned or in progress", icon: BookOpen },
    { label: "Open conduct reports", value: summary.openConductReports, note: "Open or in review", icon: TriangleAlert },
    { label: "Open conversations", value: summary.openConversations, note: "Across the program", icon: MessagesSquare },
    { label: "Supervisor assignments", value: data.assignments.length, note: "Active pairings", icon: UserCheck },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RosterCard listeners={data.listeners} />
        <ConductCard reports={data.conductReports} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SupervisorTrainingCard training={data.training} listeners={data.listeners} />
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Active listener-to-supervisor pairings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.assignments.length === 0 ? (
              <EmptyState title="No active assignments" description="Assign listeners to a supervisor to begin." />
            ) : (
              data.assignments.slice(0, 5).map((assignment) => (
                <ListRow
                  key={assignment.id}
                  title={listenerName(data.listeners, assignment.listenerId)}
                  meta={`Supervisor ${shortId(assignment.supervisorUserId)} · ${humanize(assignment.reasonCode)}`}
                  state={assignment.assignmentState}
                  trailing={formatWhen(assignment.assignedAt)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function SupervisorSection({ data }: { data: SupervisorSectionData }) {
  switch (data.kind) {
    case "listeners":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Listener roster</CardTitle>
            <CardDescription>Readiness, languages, and workload for every listener.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.listeners.length === 0 ? (
              <EmptyState title="No listeners yet" description="Approved listeners will appear here." />
            ) : (
              <SectionTable columns={["Listener", "Languages", "Eligibility", "Load"]}>
                {data.listeners.map((listener) => (
                  <SectionRow
                    key={listener.listenerProfileId}
                    columns={["Listener", "Languages", "Eligibility", "Load"]}
                    values={[
                      listener.displayName ?? listener.userId,
                      listener.profileLanguages.join(", ").toUpperCase() || "—",
                      humanize(listener.eligibilityState),
                      `${listener.openConversations}/${listener.capacityLimit}`,
                    ]}
                    state={listener.applicationState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "training":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Training reviews</CardTitle>
            <CardDescription>Track required learning and follow up on training needs.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.training.length === 0 ? (
              <EmptyState title="No training records" description="Training assignments will appear here." />
            ) : (
              <SectionTable columns={["Module", "Listener", "Completed", "Expires"]}>
                {data.training.map((record) => (
                  <SectionRow
                    key={record.id}
                    columns={["Module", "Listener", "Completed", "Expires"]}
                    values={[
                      humanize(record.moduleCode),
                      listenerName(data.listeners, record.listenerId),
                      record.completedAt ? formatWhen(record.completedAt) : "—",
                      record.expiresAt ? formatWhen(record.expiresAt) : "—",
                    ]}
                    state={record.completionState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "quality": {
      const covered = data.listeners.filter((listener) => listener.supervisorUserId).length;
      const eligible = data.listeners.filter((listener) => listener.eligibilityState === "eligible").length;
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Supervision coverage" value={`${covered}/${data.listeners.length}`} note="Listeners with a supervisor" icon={UserCheck} />
            <MetricCard label="Eligible listeners" value={eligible} note="Ready for peer support" icon={ShieldCheck} />
            <MetricCard label="Active assignments" value={data.assignments.length} note="Current pairings" icon={UsersRound} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Quality check-ins</CardTitle>
              <CardDescription>Document supportive supervision and non-clinical quality follow-ups.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.assignments.length === 0 ? (
                <EmptyState title="No active assignments" description="Assign listeners to a supervisor to begin check-ins." />
              ) : (
                <SectionTable columns={["Check-in", "Listener", "Supervisor", "Since"]}>
                  {data.assignments.map((assignment) => (
                    <SectionRow
                      key={assignment.id}
                      columns={["Check-in", "Listener", "Supervisor", "Since"]}
                      values={[
                        humanize(assignment.reasonCode),
                        listenerName(data.listeners, assignment.listenerId),
                        shortId(assignment.supervisorUserId),
                        formatWhen(assignment.assignedAt),
                      ]}
                      state={assignment.assignmentState}
                    />
                  ))}
                </SectionTable>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
    case "conduct":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Conduct reports</CardTitle>
            <CardDescription>Review member-raised concerns. Details stay encrypted and access is audited.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.reports.length === 0 ? (
              <EmptyState title="No conduct reports" description="New reports will appear here." />
            ) : (
              <SectionTable columns={["Report", "Category", "Assigned", "Opened"]}>
                {data.reports.map((report) => (
                  <SectionRow
                    key={report.id}
                    columns={["Report", "Category", "Assigned", "Opened"]}
                    values={[
                      `CR-${shortId(report.id)}`,
                      humanize(report.categoryCode),
                      report.assignedToUserId ? shortId(report.assignedToUserId) : "Unassigned",
                      formatWhen(report.createdAt),
                    ]}
                    state={report.reportState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "assignments":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Supervisor assignments</CardTitle>
            <CardDescription>Active listener-to-supervisor pairings used for readiness and quality support.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.assignments.length === 0 ? (
              <EmptyState title="No active assignments" description="Assign listeners to a supervisor to begin." />
            ) : (
              <SectionTable columns={["Listener", "Supervisor", "Reason", "Since"]}>
                {data.assignments.map((assignment) => (
                  <SectionRow
                    key={assignment.id}
                    columns={["Listener", "Supervisor", "Reason", "Since"]}
                    values={[
                      listenerName(data.listeners, assignment.listenerId),
                      shortId(assignment.supervisorUserId),
                      humanize(assignment.reasonCode),
                      formatWhen(assignment.assignedAt),
                    ]}
                    state={assignment.assignmentState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "workload":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Workload overview</CardTitle>
            <CardDescription>Compare open conversation load against each listener&apos;s chosen capacity.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.listeners.length === 0 ? (
              <EmptyState title="No listeners yet" description="Listener workload will appear here." />
            ) : (
              <SectionTable columns={["Listener", "Open conversations", "Capacity"]}>
                {data.listeners.map((listener) => (
                  <SectionRow
                    key={listener.listenerProfileId}
                    columns={["Listener", "Open conversations", "Capacity"]}
                    values={[
                      listener.displayName ?? listener.userId,
                      listener.openConversations,
                      listener.capacityLimit,
                    ]}
                    state={listener.openConversations >= listener.capacityLimit ? "at_limit" : "within_limit"}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
  }
}

function CaseQueueCard({ cases }: { cases: SafetyCase[] }) {
  const recent = cases.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned case queue</CardTitle>
        <CardDescription>Only handle cases assigned through approved operational procedures.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No safety cases" description="Newly assigned cases will appear here." />
        ) : (
          recent.map((safetyCase) => (
            <ListRow
              key={safetyCase.id}
              title={`Case · ${shortId(safetyCase.id)}`}
              meta={`${humanize(safetyCase.triggerCode)} · priority ${humanize(safetyCase.priorityCode)}`}
              state={safetyCase.caseState}
              trailing={formatWhen(safetyCase.createdAt)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SafetyFollowupsCard({ followups }: { followups: SafetyFollowup[] }) {
  const recent = followups.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
        <CardDescription>Scheduled wellbeing check-ins. Completion is recorded by a human.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No follow-ups scheduled" />
        ) : (
          recent.map((followup) => (
            <ListRow
              key={followup.id}
              title={`Member ${shortId(followup.memberId)}`}
              meta={humanize(followup.sourceType)}
              state={followup.followupState}
              trailing={formatWhen(followup.scheduledAt)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ResourcesCard({ resources }: { resources: CrisisResource[] }) {
  const recent = resources.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety resources</CardTitle>
        <CardDescription>Verified local resources for the configured region.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.length === 0 ? (
          <EmptyState title="No verified resources" description="Verified resources for IN (en) will appear here." />
        ) : (
          recent.map((resource) => (
            <ListRow
              key={resource.id}
              title={resource.displayName}
              meta={`${humanize(resource.resourceType)} · ${resource.regionCode.toUpperCase()} / ${resource.locale.toUpperCase()}`}
              state={resource.verificationState}
              trailing={resource.lastVerifiedAt ? formatWhen(resource.lastVerifiedAt) : undefined}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function SafetyOverview({ data }: { data: SafetyOverviewData }) {
  const { summary } = data;
  const metrics = [
    { label: "Assigned to me", value: summary.assignedToMe, note: "Open cases", icon: ShieldCheck },
    { label: "Open cases", value: summary.openCases, note: "Across the queue", icon: LifeBuoy },
    { label: "Handoffs pending", value: summary.handoffsPending, note: "Awaiting coordination", icon: Radio },
    { label: "Follow-ups due", value: summary.followupsDue, note: "Scheduled at or before now", icon: FileClock },
    { label: "Resources unverified", value: summary.pendingResources, note: "Need review", icon: ListChecks },
    { label: "Verified resources", value: data.resources.length, note: "IN · English", icon: ClipboardCheck },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <CaseQueueCard cases={data.cases} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SafetyFollowupsCard followups={data.followups} />
        <ResourcesCard resources={data.resources} />
      </div>
      <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Use approved, staffed human-led procedures. This workspace does not provide emergency
          dispatch or imply that human support is staffed around the clock.
        </p>
      </div>
    </>
  );
}

export function SafetySection({ data }: { data: SafetySectionData }) {
  switch (data.kind) {
    case "cases":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Assigned case queue</CardTitle>
            <CardDescription>Only handle cases assigned to you and follow approved operational procedures.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.cases.length === 0 ? (
              <EmptyState title="No safety cases" description="Newly assigned cases will appear here." />
            ) : (
              <SectionTable columns={["Case", "Trigger", "Priority", "Assigned to", "Created"]}>
                {data.cases.map((safetyCase) => (
                  <SectionRow
                    key={safetyCase.id}
                    columns={["Case", "Trigger", "Priority", "Assigned to", "Created"]}
                    values={[
                      `S-${shortId(safetyCase.id)}`,
                      humanize(safetyCase.triggerCode),
                      humanize(safetyCase.priorityCode),
                      safetyCase.assignedResponderUserId ? shortId(safetyCase.assignedResponderUserId) : "Unassigned",
                      formatWhen(safetyCase.createdAt),
                    ]}
                    state={safetyCase.caseState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "handoffs": {
      const handoffs = data.cases.filter((safetyCase) => safetyCase.caseState === "handed_off");
      return (
        <Card>
          <CardHeader>
            <CardTitle>Human handoffs</CardTitle>
            <CardDescription>Coordinate handoffs using approved, staffed pathways only.</CardDescription>
          </CardHeader>
          <CardContent>
            {handoffs.length === 0 ? (
              <EmptyState title="No pending handoffs" description="Cases handed off for human follow-up appear here." />
            ) : (
              <SectionTable columns={["Case", "Priority", "Assigned to", "Created"]}>
                {handoffs.map((safetyCase) => (
                  <SectionRow
                    key={safetyCase.id}
                    columns={["Case", "Priority", "Assigned to", "Created"]}
                    values={[
                      `H-${shortId(safetyCase.id)}`,
                      humanize(safetyCase.priorityCode),
                      safetyCase.assignedResponderUserId ? shortId(safetyCase.assignedResponderUserId) : "Unassigned",
                      formatWhen(safetyCase.createdAt),
                    ]}
                    state={safetyCase.caseState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    }
    case "resources":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Safety resources</CardTitle>
            <CardDescription>Reviewed local resources and their verification status.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.resources.length === 0 ? (
              <EmptyState title="No verified resources" description="Verified resources for IN (en) will appear here." />
            ) : (
              <SectionTable columns={["Resource", "Type", "Region", "Last verified"]}>
                {data.resources.map((resource) => (
                  <SectionRow
                    key={resource.id}
                    columns={["Resource", "Type", "Region", "Last verified"]}
                    values={[
                      resource.displayName,
                      humanize(resource.resourceType),
                      `${resource.regionCode.toUpperCase()} / ${resource.locale.toUpperCase()}`,
                      resource.lastVerifiedAt ? formatWhen(resource.lastVerifiedAt) : "—",
                    ]}
                    state={resource.verificationState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    case "actions": {
      const caseLabel = new Map(data.cases.map((safetyCase) => [safetyCase.id, `S-${shortId(safetyCase.id)}`]));
      return (
        <Card>
          <CardHeader>
            <CardTitle>Case actions</CardTitle>
            <CardDescription>Timestamped human actions recorded against safety cases. Free-text notes stay encrypted.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.actions.length === 0 ? (
              <EmptyState title="No recorded actions" description="Human actions on safety cases will appear here." />
            ) : (
              <SectionTable columns={["Case", "Action", "Actor", "Recorded"]}>
                {data.actions.map((action) => (
                  <SectionRow
                    key={action.id}
                    columns={["Case", "Action", "Actor", "Recorded"]}
                    values={[
                      caseLabel.get(action.caseId) ?? shortId(action.caseId),
                      humanize(action.actionType),
                      action.actorUserId ? shortId(action.actorUserId) : "System",
                      formatWhen(action.occurredAt),
                    ]}
                    state={action.actionState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
    }
    case "followups":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Safety follow-ups</CardTitle>
            <CardDescription>Scheduled wellbeing check-ins. Completion is not implied until a human records it.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.followups.length === 0 ? (
              <EmptyState title="No follow-ups scheduled" />
            ) : (
              <SectionTable columns={["Follow-up", "Member", "Scheduled", "Completed"]}>
                {data.followups.map((followup) => (
                  <SectionRow
                    key={followup.id}
                    columns={["Follow-up", "Member", "Scheduled", "Completed"]}
                    values={[
                      humanize(followup.sourceType),
                      shortId(followup.memberId),
                      formatWhen(followup.scheduledAt),
                      followup.completedAt ? formatWhen(followup.completedAt) : "—",
                    ]}
                    state={followup.followupState}
                  />
                ))}
              </SectionTable>
            )}
          </CardContent>
        </Card>
      );
  }
}
