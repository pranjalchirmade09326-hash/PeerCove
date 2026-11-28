export const peercoveRoleWorkspaces = {
  member: "/peercove/member",
  listener: "/peercove/listener",
  listener_supervisor: "/peercove/listener-supervisor",
  "listener-supervisor": "/peercove/listener-supervisor",
  supervisor: "/peercove/listener-supervisor",
  safety_operations_specialist: "/peercove/safety-operations",
  safety_operations: "/peercove/safety-operations",
  "safety-operations": "/peercove/safety-operations",
  safety: "/peercove/safety-operations",
  platform_administrator: "/peercove/platform-administrator",
  "platform-administrator": "/peercove/platform-administrator",
  admin: "/peercove/platform-administrator",
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
