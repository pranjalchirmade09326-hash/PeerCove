import { headers, cookies } from "next/headers";
import { cache } from "react";
import { AuthResponse } from "./types";

export function getDevSession(role = "doctor"): AuthResponse {
  const normalizedRole = (role || "doctor").toString().trim().toLowerCase();
  const cleanRole =
    normalizedRole === "doctor" || normalizedRole === "admin" || normalizedRole === "patient"
      ? normalizedRole
      : normalizedRole.includes("doctor")
      ? "doctor"
      : normalizedRole.includes("admin")
      ? "admin"
      : "patient";
  const isDoctor = cleanRole === "doctor";
  const isAdmin = cleanRole === "admin";
  const name = isDoctor
    ? "Dr. John Smith"
    : isAdmin
    ? "System Administrator"
    : "Sarah Jenkins";
  const email = isDoctor
    ? "doctor@peercove.app"
    : isAdmin
    ? "admin@peercove.app"
    : "patient@peercove.app";
  const redirectUrl = isDoctor
    ? "/bezs/telemedicine/doctor/dashboard"
    : isAdmin
    ? "/bezs/telemedicine/admin/organizations"
    : "/bezs/telemedicine/patient";

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
      apps: ["telemedicine", "emr", "ai-hub"],
      permissions: ["*"],
      organizations: [
        {
          id: "org-default-01",
          name: "PeerCove Healthcare",
          slug: "peercove-health",
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
