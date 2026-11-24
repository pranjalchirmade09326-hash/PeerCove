/**
 * PeerCove role-based access control (RBAC).
 *
 * Layer: shared / auth
 *
 * Sign-in assigns exactly one workspace role: "member" or "listener".
 * Each role may only access its own dashboard routes — anything else is
 * redirected to the sign-in page.
 */

export const PEERCOVE_SIGNIN_ROLES = [
  "member",
  "listener",
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
] as const;

export type PeerCoveSigninRole = (typeof PEERCOVE_SIGNIN_ROLES)[number];

/** Route prefix each role is allowed to browse. */
export const ROLE_HOME: Record<PeerCoveSigninRole, string> = {
  member: "/peercove/member",
  listener: "/peercove/listener",
  "listener-supervisor": "/peercove/listener-supervisor",
  "safety-operations": "/peercove/safety-operations",
  "platform-administrator": "/peercove/platform-administrator",
};

/** Staff-only role ids still referenced by dashboards/preview tooling. */
export const STAFF_ROLES = [
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
  "ai-agent",
] as const;

export function isPeerCoveSigninRole(value: unknown): value is PeerCoveSigninRole {
  return (
    typeof value === "string" &&
    (PEERCOVE_SIGNIN_ROLES as readonly string[]).includes(value)
  );
}

/**
 * Normalizes hyphenated and underscored role codes across IAM and frontend.
 */
export function normalizeRoleCode(role?: string | null): PeerCoveSigninRole | null {
  if (!role || typeof role !== "string") return null;
  const trimmed = role.trim();
  if (isPeerCoveSigninRole(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (lower === "listener_supervisor" || lower === "listener-supervisor" || lower === "supervisor") {
    return "listener-supervisor";
  }
  if (
    lower === "safety_operations_specialist" ||
    lower === "safety_operations" ||
    lower === "safety-operations" ||
    lower === "safety"
  ) {
    return "safety-operations";
  }
  if (
    lower === "platform_administrator" ||
    lower === "platform-administrator" ||
    lower === "admin"
  ) {
    return "platform-administrator";
  }
  if (lower === "patient") {
    return "member";
  }
  if (lower === "doctor") {
    return "listener";
  }
  return null;
}

/**
 * Decides whether `userRole` may view the workspace at `pathname`.
 * Returns the redirect target:
 *  - null        → allowed
 *  - "/login"    → not signed in
 *  - role home   → signed in but wrong workspace
 */
export function resolveWorkspaceAccess(
  pathname: string,
  userRole?: string | null,
): string | null {
  // In development, allow browsing all role dashboards and demo pages
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  // Normalize locale prefixes.
  const cleanPath = pathname.replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");

  const workspaceMatch = cleanPath.match(/^\/peercove\/([^/]+)/);
  if (!workspaceMatch) {
    // Intake flows belong to the member workspace.
    if (cleanPath.startsWith("/intake")) {
      if (!userRole) return "/login";
      const normalizedRole = normalizeRoleCode(userRole);
      if (normalizedRole && normalizedRole !== "member") {
        return ROLE_HOME[normalizedRole];
      }
    }
    return null;
  }

  const routeRole = workspaceMatch[1];
  const normalizedRouteRole = normalizeRoleCode(routeRole) ?? routeRole;

  if (!userRole) return "/login";

  const normalizedUserRole = normalizeRoleCode(userRole);
  if (normalizedUserRole) {
    if (normalizedRouteRole === normalizedUserRole) return null;
    return ROLE_HOME[normalizedUserRole];
  }

  if (routeRole === userRole) return null;

  // Staff roles are session-driven previews; leave those alone.
  return null;
}
