import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/wellbeing/goals");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json([
      { id: "g-1", goal: "15-minute daily mindfulness breathing", status: "active", target_date: "2026-11-20" },
      { id: "g-2", goal: "Evening digital screen wind-down before 10 PM", status: "active", target_date: "2026-11-25" },
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
    const data = await request("/api/v1/wellbeing/goals", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      id: `g-${Date.now()}`,
      goal: body.goal || "Personal Wellbeing Goal",
      status: "active",
      target_date: body.target_date || null,
      created_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}

