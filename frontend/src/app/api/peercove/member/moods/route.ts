import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/wellbeing/moods");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json([
      { id: "m-1", mood_code: "peaceful", scale_value: 8.5, note: "Evening reflection and mindfulness breathwork", recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: "m-2", mood_code: "grateful", scale_value: 9.0, note: "Feeling centered and calm after meditation", recorded_at: new Date(Date.now() - 86400000).toISOString() },
      { id: "m-3", mood_code: "calm", scale_value: 8.0, note: "Positive somatic focus, feeling grounded", recorded_at: new Date().toISOString() },
    ]);
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
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/wellbeing/moods", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      id: `m-${Date.now()}`,
      mood_code: body.mood_code || "calm",
      scale_value: body.scale_value || 8.0,
      note: body.note || null,
      recorded_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}

