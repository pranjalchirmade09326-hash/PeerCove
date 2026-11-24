import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Pool } from "pg";

/**
 * Dev-login & Registration Handler
 *
 * 1. Asynchronously writes to PostgreSQL (port 5433 / peercove):
 *      - app_principals
 *      - member_profiles
 *      - role_assignments
 *      - member_preferences
 *      - iam.user
 *    Without blocking the user response so dashboard navigation is instant.
 *
 * 2. Issues an authenticated `peercove_session` cookie for seamless dashboard access.
 */

const PEERCOVE_ROLES = [
  "member",
  "listener",
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
] as const;

type PeerCoveRole = (typeof PEERCOVE_ROLES)[number];

// Connection pool for local PeerCove PostgreSQL
const pgPool = new Pool({
  connectionString:
    process.env.PEERCOVE_DATABASE_URL ||
    process.env.DATABASE_URL_PEERCOVE ||
    "postgresql://peercove:dev-only-change-me@localhost:5433/peercove?schema=public",
  connectionTimeoutMillis: 200,
  idleTimeoutMillis: 10000,
  max: 5,
});

function normalizeRole(raw: string): { dbRole: string; roleKey: PeerCoveRole } {
  const r = (raw || "member").trim().toLowerCase().replace(/[-_]/g, "");
  if (r.includes("supervisor")) {
    return { dbRole: "listener_supervisor", roleKey: "listener-supervisor" };
  }
  if (r.includes("safety")) {
    return { dbRole: "safety_operations_specialist", roleKey: "safety-operations" };
  }
  if (r.includes("admin")) {
    return { dbRole: "platform_administrator", roleKey: "platform-administrator" };
  }
  if (r.includes("listener")) {
    return { dbRole: "listener", roleKey: "listener" };
  }
  return { dbRole: "member", roleKey: "member" };
}

async function persistToPeerCoveDatabase(
  userId: string,
  name: string,
  dbRole: string
): Promise<void> {
  let client;
  try {
    client = await pgPool.connect();

    // 1. AppPrincipal (core user identity)
    await client.query(
      `INSERT INTO app_principals (user_id, account_state, created_at, updated_at)
       VALUES ($1, 'active', NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET account_state = 'active', updated_at = NOW();`,
      [userId]
    );

    // 2. MemberProfile (display name & eligibility)
    await client.query(
      `INSERT INTO member_profiles (user_id, display_name, eligibility_state, profile_state, created_at, updated_at)
       VALUES ($1, $2, 'eligible', 'active', NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET display_name = $2, eligibility_state = 'eligible', profile_state = 'active', updated_at = NOW();`,
      [userId, name]
    );

    // 3. RoleAssignment (assigned role, prevent duplicate active rows)
    await client.query(
      `INSERT INTO role_assignments (id, user_id, role_code, assignment_state, decision_reason, granted_at)
       SELECT gen_random_uuid(), $1, $2, 'active', 'User registration from PeerCove portal', NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM role_assignments WHERE user_id = $1 AND role_code = $2 AND assignment_state = 'active'
       );`,
      [userId, dbRole]
    );

    // 4. MemberPreference (defaults)
    await client.query(
      `INSERT INTO member_preferences (user_id, locale, timezone, preferred_languages, accessibility, communication, support_preferences, updated_at)
       VALUES ($1, 'en', 'UTC', ARRAY['en'], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, NOW())
       ON CONFLICT (user_id) DO NOTHING;`,
      [userId]
    );

    // 5. Optionally sync to iam."user" if the IAM schema exists
    try {
      await client.query(
        `INSERT INTO iam."user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $1, true, $3, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET name = $2, role = $3, "updatedAt" = NOW();`,
        [userId, name, dbRole]
      );
    } catch {
      // iam schema is optional
    }
  } catch (dbErr: any) {
    console.warn("[dev-login] DB write warning (database may be offline or syncing):", dbErr?.message || dbErr);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawRole = (body.role || "member").toString();
    const { dbRole, roleKey } = normalizeRole(rawRole);
    const locale = (body.locale || "en").toString().trim().toLowerCase();

    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim().toLowerCase()
        : `${roleKey}@peercove.local`;

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : email.split("@")[0].replace(/[-_.]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Trigger database persistence in background without blocking instant HTTP redirect
    persistToPeerCoveDatabase(email, name, dbRole).catch(() => {});

    const defaultRedirect = `/peercove/${roleKey}`;
    let redirectPath = (
      typeof body.redirectUrl === "string" && body.redirectUrl
        ? body.redirectUrl
        : defaultRedirect
    ).replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");
    if (!redirectPath.startsWith("/")) redirectPath = `/${redirectPath}`;
    redirectPath = redirectPath.replace(/\/+/g, "/");
    const fullRedirectUrl = `/${locale}${redirectPath}`;

    const sessionData = {
      user: {
        id: email,
        name,
        email,
        emailVerified: true,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        username: email.split("@")[0],
        displayUsername: name,
        twoFactorEnabled: false,
        role: roleKey,
        banned: false,
        banReason: null,
        banExpires: null,
      },
      session: {
        id: `sess-${roleKey}-${Date.now()}`,
        token: "dev-jwt-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        userAgent: "Local Dev Browser",
        userId: email,
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
        activeOrganizationRoles: [roleKey],
        activeRoleId: `role-${roleKey}`,
        activeRole: roleKey,
        activeRoleRedirectUrl: redirectPath,
      },
    };

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    };

    const cookieStore = await cookies();
    cookieStore.set("peercove_session", JSON.stringify(sessionData), cookieOptions);
    cookieStore.set("dev_token", "dev-jwt-token", cookieOptions);
    cookieStore.set("activeRoleRedirectUrl", fullRedirectUrl, cookieOptions);

    const response = NextResponse.json({
      success: true,
      redirectUrl: fullRedirectUrl,
      user: { email, name, role: roleKey, dbRole },
    });
    response.cookies.set("peercove_session", JSON.stringify(sessionData), cookieOptions);
    response.cookies.set("dev_token", "dev-jwt-token", cookieOptions);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    console.error("[dev-login] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
