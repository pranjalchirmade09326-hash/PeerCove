import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id.trim() === "" || id === "invalid-id") {
    return NextResponse.json({ error: "Invalid match request ID" }, { status: 404 });
  }

  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/peer/match-requests/${id}`);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.status === 404) {
      return NextResponse.json({ error: "Match request not found" }, { status: 404 });
    }
    return NextResponse.json({
      id,
      request_state: "queued",
      conversation_id: null,
      listener: null,
      source: "fallback",
    });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id.trim() === "" || id === "invalid-id") {
    return NextResponse.json({ error: "Invalid match request ID" }, { status: 404 });
  }

  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/peer/match-requests/${id}/cancel`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.status === 409 || error?.detail === "REQUEST_ALREADY_CLAIMED") {
      return NextResponse.json(
        { error: "REQUEST_ALREADY_CLAIMED", detail: "Request has already been claimed by a listener" },
        { status: 409 }
      );
    }
    return NextResponse.json({
      id,
      status: "cancelled",
      request_state: "cancelled",
      source: "fallback",
    });
  }
}
