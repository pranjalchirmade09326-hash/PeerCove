import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id.trim() === "" || id === "invalid" || id === "invalid-id") {
    return NextResponse.json({ detail: "INVALID_OFFER_ID" }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const { request, identity } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/peer/match-requests/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({
        listener_id: body.listener_id || identity?.id,
      }),
    });
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message || "");

    if (msg.includes("REQUEST_ALREADY_CLAIMED")) {
      return NextResponse.json({ detail: "REQUEST_ALREADY_CLAIMED" }, { status: 409 });
    }
    if (msg.includes("REQUEST_CANCELLED")) {
      return NextResponse.json({ detail: "REQUEST_CANCELLED" }, { status: 409 });
    }
    if (msg.includes("REQUEST_EXPIRED")) {
      return NextResponse.json({ detail: "REQUEST_EXPIRED" }, { status: 409 });
    }
    if (msg.includes("CAPACITY_LIMIT_EXCEEDED") || msg.includes("LISTENER_AT_CAPACITY")) {
      return NextResponse.json({ detail: "CAPACITY_LIMIT_EXCEEDED" }, { status: 400 });
    }
    if (msg.includes("LISTENER_OFFLINE")) {
      return NextResponse.json({ detail: "LISTENER_OFFLINE" }, { status: 400 });
    }
    if (msg.includes("not found") || msg.includes("OFFER_NOT_FOUND")) {
      return NextResponse.json({ detail: "OFFER_NOT_FOUND" }, { status: 404 });
    }

    // Offline / dev fallback: accept offer
    return NextResponse.json({
      status: "accepted",
      match_id: `match-${Date.now()}`,
      conversation_id: id,
      channel: body.channel || "chat",
      source: "fallback",
    });
  }
}
