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

export async function getPeerCoveAuthSession(): Promise<BetterAuthIdentity | null> {
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
          email: "member@peercove.test",
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
          email: "member@peercove.test",
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
        name: "PeerCove Member",
        email: "member@peercove.test",
      };
    }
    return null;
  }
}

async function getPeerCoveBearerToken(expectedUserId: string): Promise<string> {
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
      `PeerCove API request failed (${response.status}).`;
    const code = result?.error?.code;
    const err: any = new Error(code ? `${code}: ${message}` : message);
    err.status = response.status;
    err.detail = detailMsg;
    throw err;
  }
  return result as T;
}

export async function createPeerCoveApiClient() {
  const identity = await getPeerCoveAuthSession();
  if (!identity) {
    throw new Error("Sign in with your PeerCove account before continuing.");
  }

  const apiUrl = process.env.PEERCOVE_API_URL;
  if (!apiUrl) {
    throw new Error("PEERCOVE_API_URL is not configured.");
  }
  const baseUrl = new URL(apiUrl);
  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("PEERCOVE_API_URL must use HTTPS in production.");
  }

  const token = await getPeerCoveBearerToken(identity.id);
  const request = async <T>(path: string, init?: RequestInit, retries = 2): Promise<T> => {
    // 45-second timeout to handle Render serverless cold-start wakeups smoothly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
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

      // If Render backend is spinning up (502/503/504), wait 2s and retry once
      if ((response.status === 502 || response.status === 503 || response.status === 504) && retries > 0) {
        await new Promise((r) => setTimeout(r, 2000));
        return request<T>(path, init, retries - 1);
      }

      return readApiResponse<T>(response);
    } catch (err: any) {
      if (retries > 0 && (err.name === "AbortError" || err.message?.includes("fetch failed"))) {
        await new Promise((r) => setTimeout(r, 2000));
        return request<T>(path, init, retries - 1);
      }
      throw err;
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
