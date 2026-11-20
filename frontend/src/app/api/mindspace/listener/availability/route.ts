import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

let fallbackActive = true;

export async function GET() {
  try {
    const { request } = await createMindspaceApiClient();
    const data: any = await request("/api/v1/listeners/me/summary");
    const active =
      data?.active_now !== undefined
        ? Boolean(data.active_now)
        : data?.activeNow !== undefined
        ? Boolean(data.activeNow)
        : data?.isOnline !== undefined
        ? Boolean(data.isOnline)
        : fallbackActive;

    return NextResponse.json({
      status: "success",
      is_available: active,
      activeNow: active,
      active_now: active,
      is_online: active,
      capacityLimit: data?.capacityLimit ?? 3,
      openConversations: data?.openConversations ?? 0,
    });
  } catch (_error: any) {
    return NextResponse.json({
      status: "success",
      is_available: fallbackActive,
      activeNow: fallbackActive,
      active_now: fallbackActive,
      is_online: fallbackActive,
      capacityLimit: 3,
      openConversations: 0,
      source: "fallback",
    });
  }
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const { request } = await createMindspaceApiClient();
    const data: any = await request("/api/v1/listeners/me/toggle-active", {
      method: "POST",
    });

    const isAvailable = Boolean(data?.active_now ?? data?.is_online ?? true);
    fallbackActive = isAvailable;

    return NextResponse.json({
      status: "success",
      is_available: isAvailable,
      activeNow: isAvailable,
      active_now: isAvailable,
      is_online: isAvailable,
    });
  } catch (_error: any) {
    const explicit =
      body?.active_now !== undefined
        ? body.active_now
        : body?.activeNow !== undefined
        ? body.activeNow
        : body?.is_available !== undefined
        ? body.is_available
        : body?.active !== undefined
        ? body.active
        : body?.isOnline !== undefined
        ? body.isOnline
        : undefined;

    if (typeof explicit === "boolean") {
      fallbackActive = explicit;
    } else {
      fallbackActive = !fallbackActive;
    }

    return NextResponse.json({
      status: "success",
      is_available: fallbackActive,
      activeNow: fallbackActive,
      active_now: fallbackActive,
      is_online: fallbackActive,
      source: "fallback",
    });
  }
}
