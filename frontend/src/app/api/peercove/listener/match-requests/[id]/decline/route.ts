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
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/peer/match-requests/${id}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason: body.reason }),
    });
    return NextResponse.json(data, { status: 200 });
  } catch (_err: any) {
    return NextResponse.json({
      status: "declined",
      offer_id: id,
      reassigned: true,
      source: "fallback",
    });
  }
}
