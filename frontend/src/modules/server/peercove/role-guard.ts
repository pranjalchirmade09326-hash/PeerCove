import "server-only";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getServerSession } from "@/modules/server/auth/get-session";
import {
  workspaceForRoles,
  normalizeRoleCode,
  type PeerCoveRoleCode,
} from "./role-map";

const slugToRole: Record<string, PeerCoveRoleCode> = {
  member: "member",
  listener: "listener",
  "listener-supervisor": "listener_supervisor",
  listener_supervisor: "listener_supervisor",
  supervisor: "listener_supervisor",
  "safety-operations": "safety_operations_specialist",
  safety_operations: "safety_operations_specialist",
  safety_operations_specialist: "safety_operations_specialist",
  safety: "safety_operations_specialist",
  "platform-administrator": "platform_administrator",
  platform_administrator: "platform_administrator",
  admin: "platform_administrator",
};

/**
 * Redirects signed-in users away from a role workspace that their account
 * does not hold. Anonymous/dev requests fall through to the layout's own
 * auth handling.
 */
export async function enforcePeerCoveRoleAccess(slug: string): Promise<void> {
  const required = slugToRole[slug] || normalizeRoleCode(slug);
  if (!required) return;

  const session = await getServerSession();
  if (!session) return;

  const roleValue = session.user?.role || session.session?.activeRole || "";
  const roles = roleValue
    .split(",")
    .map((role) => normalizeRoleCode(role.trim()))
    .filter((role): role is PeerCoveRoleCode => role !== null);

  // Legacy/dev roles (e.g. "patient") have no PeerCove workspace of their
  // own; redirecting them here would loop, so let the dashboard render.
  if (roles.length === 0) return;
  if (roles.includes(required)) return;

  const locale = await getLocale();
  redirect({ href: workspaceForRoles(roleValue), locale });
}
