import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data: unknown = await request("/api/v1/peer/listeners");
    const list = Array.isArray(data)
      ? data
      : ((data as { listeners?: unknown[] })?.listeners ?? []);
    return NextResponse.json({ listeners: list });
  } catch (err) {
    console.warn("[member/listeners] Failed to fetch listeners:", err);
    return NextResponse.json({ listeners: [] }, { status: 200 });
  }
}
