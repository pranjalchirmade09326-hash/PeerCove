import { headers, cookies } from "next/headers";
import { cache } from "react";
import { AuthResponse } from "./types";

export function getDevSession(role = "member"): AuthResponse {
  const normalizedRole = (role || "member").toString().trim().toLowerCase().replace(/_/g, "-");
  const cleanRole =
    normalizedRole === "platform-administrator" || normalizedRole === "admin"
      ? "platform-administrator"
      : normalizedRole === "safety-operations" ||
          normalizedRole === "safety-operations-specialist" ||
          normalizedRole === "safety"
        ? "safety-operations"
        : normalizedRole === "listener-supervisor" || normalizedRole === "supervisor"
          ? "listener-supervisor"
          : normalizedRole === "listener" || normalizedRole === "doctor"
            ? "listener"
            : "member";

  const roleDisplay: Record<string, { name: string; email: string }> = {
    member: { name: "Sarah Jenkins", email: "member@peercove.app" },
    listener: { name: "Aarav Sharma", email: "listener@peercove.app" },
    "listener-supervisor": { name: "Dr. Alok Verma", email: "supervisor@peercove.app" },
    "safety-operations": { name: "Riya Kapoor", email: "safety@peercove.app" },
    "platform-administrator": { name: "System Administrator", email: "admin@peercove.app" },
  };
  const { name, email } = roleDisplay[cleanRole];
  const redirectUrl = `/peercove/${cleanRole}`;

  return {
    user: {
      id: `usr-${cleanRole}-01`,
      name,
      email,
      emailVerified: true,
      image: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      username: cleanRole,
      displayUsername: name,
      twoFactorEnabled: false,
      role: cleanRole,
      banned: false,
      banReason: null,
      banExpires: null,
    },
    session: {
      id: `sess-${cleanRole}-01`,
      token: "dev-jwt-token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ipAddress: "127.0.0.1",
      userAgent: "Local Dev Browser",
      userId: `usr-${cleanRole}-01`,
      activeOrganizationId: "org-default-01",
      activeTeamId: null,
      impersonatedBy: null,
      apps: ["peercove"],
      permissions: ["*"],
      organizations: [
        {
          id: "org-default-01",
          name: "PeerCove",
          slug: "peercove",
          logo: null,
        },
      ],
      activeOrganizationRoles: [cleanRole],
      activeRoleId: `role-${cleanRole}`,
      activeRole: cleanRole,
      activeRoleRedirectUrl: redirectUrl,
    },
  };
}

export const getServerSession = cache(async function getServerSession(): Promise<AuthResponse | null> {
  // 1. Check local session cookie first (for local dev mode)
  try {
    const cookieStore = await cookies();
    const devCookie = cookieStore.get("peercove_session");
    if (devCookie?.value) {
      const raw = devCookie.value.startsWith("%")
        ? decodeURIComponent(devCookie.value)
        : devCookie.value;
      return JSON.parse(raw) as AuthResponse;
    }
  } catch {
    // Continue to external check
  }

  // 2. Fall back to external BetterAuth if configured and reachable
  try {
    const authUrl =
      process.env.BETTER_AUTH_INTERNAL_URL ||
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    if (authUrl && authUrl.startsWith("http")) {
      const hdrs = await headers();
      const cookie = hdrs.get("cookie") || "";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 150);

      try {
        const res = await fetch(`${authUrl}/api/auth/get-session`, {
          headers: { cookie },
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.ok) {
          return await res.json();
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  } catch {
    // Continue
  }

  // 3. If no session cookie or active BetterAuth session, return null so unauthenticated users see Sign In / Sign Up
  return null;
});
