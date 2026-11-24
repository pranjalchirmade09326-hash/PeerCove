import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const raw = await req.json().catch(() => ({}));
    const payload = {
      status: raw.status || "completed",
      note: raw.note || "Daily consistency check-in",
    };
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/wellbeing/goals/${id}/checkins`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (_error: any) {
    return NextResponse.json({
      goal_id: id,
      status: "completed",
      recorded_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}
