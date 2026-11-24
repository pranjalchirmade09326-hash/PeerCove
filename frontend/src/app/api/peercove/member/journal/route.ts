import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/wellbeing/journal");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json([
      {
        id: "j-1",
        title: "Finding Grounding in Uncertainty",
        body: "Today was busy, but taking 10 minutes to sit by the window helped calm the internal rush. Focus on one task at a time tomorrow.",
        tags: ["Mindfulness", "Grounding", "Evening"],
        date: new Date().toISOString(),
      },
      {
        id: "j-2",
        title: "Gratitude for Small Moments",
        body: "Grateful for the morning tea in silence, a warm conversation with a colleague, and finishing my planned workout.",
        tags: ["Gratitude", "Morning"],
        date: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }
}

export async function POST(req: Request) {
  let raw: any = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }

  try {
    const payload = {
      title: raw.title || "Personal Reflection",
      body: raw.body || raw.content || "Reflective thoughts recorded in personal sanctuary.",
      visibility: raw.visibility || "private",
    };
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/wellbeing/journal", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      id: `j-${Date.now()}`,
      title: raw.title || "Personal Reflection",
      body: raw.body || raw.content || "",
      tags: ["Private", "Journal"],
      date: new Date().toISOString(),
      source: "fallback",
    });
  }
}

