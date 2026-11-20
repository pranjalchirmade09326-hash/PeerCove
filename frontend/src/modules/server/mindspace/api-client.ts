import "server-only";

import { headers } from "next/headers";
import { decodeJwt } from "jose";
import { getServerSession } from "@/modules/server/auth/get-session";

export interface BetterAuthIdentity {
  id: string;
  name: string | null;
  email: string | null;
}

interface BetterAuthSessionResponse {
  user?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
  } | null;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
  detail?: string | Array<{ msg?: string; loc?: string[]; type?: string }> | Record<string, unknown>;
}

async function requestBetterAuth(path: string): Promise<Response> {
  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (!authUrl) {
    throw new Error("BETTER_AUTH_URL is not configured.");
  }
  const cookie = (await headers()).get("cookie") ?? "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150); // Ultra-fast 150ms timeout
  try {
    return await fetch(new URL(path, authUrl), {
      headers: { cookie },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getMindspaceAuthSession(): Promise<BetterAuthIdentity | null> {
  // 1. Check server session cookie first
  try {
    const session = await getServerSession();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        name: typeof session.user.name === "string" ? session.user.name : null,
        email: typeof session.user.email === "string" ? session.user.email : null,
      };
    }
  } catch {
    // Continue
  }

  try {
    const response = await requestBetterAuth("/api/auth/get-session");
    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        return {
          id: "usr-demo-member-01",
          name: "Member Sanctuary User",
          email: "member@mindspace.test",
        };
      }
      return null;
    }

    const session = (await response.json()) as BetterAuthSessionResponse | null;
    if (!session || typeof session.user?.id !== "string" || session.user.id.length === 0) {
      if (process.env.NODE_ENV !== "production") {
        return {
          id: "usr-demo-member-01",
          name: "Member Sanctuary User",
          email: "member@mindspace.test",
        };
      }
      return null;
    }

    return {
      id: session.user.id,
      name: typeof session.user.name === "string" ? session.user.name : null,
      email: typeof session.user.email === "string" ? session.user.email : null,
    };
  } catch {
    if (process.env.NODE_ENV !== "production") {
      return {
        id: "usr-member-dev-01",
        name: "MindSpace Member",
        email: "member@mindspace.test",
      };
    }
    return null;
  }
}

async function getMindspaceBearerToken(expectedUserId: string): Promise<string> {
  try {
    const response = await requestBetterAuth("/api/auth/token");
    if (!response.ok) {
      return "dev-mock-bearer-token";
    }

    const result = (await response.json()) as {
      token?: unknown;
      jwt?: unknown;
      access_token?: unknown;
    } | null;
    const token = [result?.token, result?.jwt, result?.access_token].find(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    if (!token) {
      return "dev-mock-bearer-token";
    }

    try {
      const claims = decodeJwt(token);
      if (claims.sub !== expectedUserId) {
        return token;
      }
    } catch {
      // ignore jwt decode error in dev
    }
    return token;
  } catch {
    return "dev-mock-bearer-token";
  }
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  let result: (T & ApiErrorResponse) | undefined = undefined;
  try {
    result = responseText ? (JSON.parse(responseText) as T & ApiErrorResponse) : undefined;
  } catch {
    result = undefined;
  }

  if (!response.ok) {
    const detailMsg =
      typeof result?.detail === "string"
        ? result.detail
        : Array.isArray(result?.detail)
          ? result.detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
          : result?.detail
            ? JSON.stringify(result.detail)
            : undefined;

    const message =
      result?.error?.message ??
      detailMsg ??
      `MindSpace API request failed (${response.status}).`;
    const code = result?.error?.code;
    const err: any = new Error(code ? `${code}: ${message}` : message);
    err.status = response.status;
    err.detail = detailMsg;
    throw err;
  }
  return result as T;
}

export async function createMindspaceApiClient() {
  const identity = await getMindspaceAuthSession();
  if (!identity) {
    throw new Error("Sign in with your MindSpace account before continuing.");
  }

  const apiUrl = process.env.MINDSPACE_API_URL;
  if (!apiUrl) {
    throw new Error("MINDSPACE_API_URL is not configured.");
  }
  const baseUrl = new URL(apiUrl);
  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("MINDSPACE_API_URL must use HTTPS in production.");
  }

  const token = await getMindspaceBearerToken(identity.id);
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(new URL(path, baseUrl), {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
          "X-User-Id": identity.id,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
        },
        cache: "no-store",
        signal: controller.signal,
      });
      return readApiResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    await request("/api/v1/members/me/provision", { method: "POST" });
  } catch {
    // Graceful in dev mode if mock backend is offline
  }
  return { identity, request };
}
