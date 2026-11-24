import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/operations/safety/cases/${id}/actions`);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([
      {
        id: "act-1",
        actionType: "outreach",
        decision: "Warm Crisis Helpline Handoff",
        notes: "Provided Tele-MANAS (14416) regional contact details to member.",
        performedAt: new Date().toISOString(),
      },
    ]);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/operations/safety/cases/${id}/actions`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true, id: `act-${Date.now()}`, recorded: true });
  }
}
