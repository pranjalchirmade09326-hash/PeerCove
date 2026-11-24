import { Clock3, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWhen(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export function formatWindow(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  return `${dateTimeFormatter.format(start)} – ${dateTimeFormatter.format(end)}`;
}

export function humanize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const positiveStates = new Set([
  "active",
  "open",
  "granted",
  "eligible",
  "completed",
  "passed",
  "approved",
  "sent",
  "delivered",
  "published",
  "matched",
  "accepted",
  "responded",
  "resolved",
  "verified",
  "available",
  "within_limit",
]);

const attentionStates = new Set([
  "queued",
  "pending",
  "scheduled",
  "in_progress",
  "in_review",
  "offered",
  "requested",
  "matching",
  "paused",
  "attempted",
  "assigned",
  "new",
  "handed_off",
  "at_limit",
]);

function stateClasses(state: string) {
  const key = state.toLowerCase();
  if (positiveStates.has(key)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300";
  }
  if (attentionStates.has(key)) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
  }
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
}

export function StateBadge({ state }: { state: string }) {
  return (
    <Badge variant="outline" className={`w-fit whitespace-nowrap ${stateClasses(state)}`}>
      {humanize(state)}
    </Badge>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex-row items-start justify-between">
        <div className="space-y-1">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <span className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{note}</CardContent>
    </Card>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function ListRow({
  title,
  meta,
  state,
  trailing,
}: {
  title: string;
  meta: string;
  state?: string;
  trailing?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="flex items-center gap-3">
        {trailing && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="size-3" aria-hidden="true" />
            {trailing}
          </span>
        )}
        {state && <StateBadge state={state} />}
      </div>
    </div>
  );
}

export function SectionTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div
        className="hidden gap-4 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
      >
        {columns.map((column) => <span key={column}>{column}</span>)}
        <span>Status</span>
      </div>
      {children}
    </div>
  );
}

export function SectionRow({
  columns,
  values,
  state,
}: {
  columns: string[];
  values: (string | number)[];
  state: string;
}) {
  return (
    <div
      className="grid gap-3 rounded-xl border p-4 md:items-center md:gap-4"
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
    >
      {values.map((value, index) => (
        <div key={`${columns[index]}-${index}`} className="min-w-0">
          <p className="text-xs text-muted-foreground md:hidden">{columns[index]}</p>
          <p className="break-words text-sm">{value}</p>
        </div>
      ))}
      <StateBadge state={state} />
    </div>
  );
}
