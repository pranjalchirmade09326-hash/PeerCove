import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const requestId = body.id || body.request_id || body.requestId;
  if (!requestId) {
    return NextResponse.json({ error: "Missing match request ID" }, { status: 400 });
  }

  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/peer/match-requests/${requestId}/cancel`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const isConflict =
      error?.status === 409 ||
      error?.detail === "REQUEST_ALREADY_CLAIMED" ||
      (typeof error?.detail === "string" && error.detail.includes("REQUEST_ALREADY_CLAIMED")) ||
      (typeof error?.message === "string" && error.message.includes("REQUEST_ALREADY_CLAIMED"));

    if (isConflict) {
      return NextResponse.json(
        { detail: "REQUEST_ALREADY_CLAIMED", error: "Request already claimed by listener" },
        { status: 409 }
      );
    }
    return NextResponse.json({
      id: requestId,
      status: "cancelled",
      request_state: "cancelled",
      source: "fallback",
    });
  }
}
