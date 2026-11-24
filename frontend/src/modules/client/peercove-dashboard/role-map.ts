export const peercoveRoleWorkspaces = {
  member: "/peercove/member",
  listener: "/peercove/listener",
  listener_supervisor: "/peercove/supervisor",
  "listener-supervisor": "/peercove/supervisor",
  supervisor: "/peercove/supervisor",
  safety_operations_specialist: "/peercove/safety",
  safety_operations: "/peercove/safety",
  "safety-operations": "/peercove/safety",
  safety: "/peercove/safety",
  platform_administrator: "/peercove/admin",
  "platform-administrator": "/peercove/admin",
  admin: "/peercove/admin",
} as const;

export type PeerCoveRoleCode = keyof typeof peercoveRoleWorkspaces;

const rolePriority: PeerCoveRoleCode[] = [
  "platform_administrator",
  "platform-administrator",
  "admin",
  "safety_operations_specialist",
  "safety_operations",
  "safety-operations",
  "safety",
  "listener_supervisor",
  "listener-supervisor",
  "supervisor",
  "listener",
  "member",
];

export function normalizeRoleCode(role?: string | null): PeerCoveRoleCode | null {
  if (!role || typeof role !== "string") return null;
  const lower = role.trim().toLowerCase().replace(/[-_]/g, "");
  if (lower.includes("supervisor")) return "listener_supervisor";
  if (lower.includes("safety")) return "safety_operations_specialist";
  if (lower.includes("admin")) return "platform_administrator";
  if (lower.includes("listener") || lower.includes("doctor")) return "listener";
  if (lower.includes("member") || lower.includes("patient")) return "member";
  return null;
}

export function parseRoles(value: string | null | undefined): PeerCoveRoleCode[] {
  if (!value) return [];
  return value
    .split(",")
    .map((role) => normalizeRoleCode(role.trim()))
    .filter((role): role is PeerCoveRoleCode => role !== null);
}

export function workspaceForRoles(value: string | null | undefined, locale?: string): string {
  const roles = parseRoles(value);
  const highest = rolePriority.find((role) => roles.includes(role)) ?? "member";
  const rawPath = peercoveRoleWorkspaces[highest] ?? "/peercove/member";
  if (locale) {
    const cleanPath = rawPath.replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");
    return `/${locale}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
  }
  return rawPath;
}
