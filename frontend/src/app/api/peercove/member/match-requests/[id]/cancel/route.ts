import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing match request ID" }, { status: 400 });
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
