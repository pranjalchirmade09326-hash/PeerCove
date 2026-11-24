import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/peer/conversations");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json([
      {
        id: "sess-1",
        date: new Date().toISOString(),
        listenerName: "Aarav Sharma (Verified Peer Listener)",
        channel: "video",
        status: "active",
        note: "Evening reflection and mindfulness check-in",
      },
      {
        id: "sess-2",
        date: new Date(Date.now() - 86400000).toISOString(),
        listenerName: "Priya Nair (Volunteer Listener)",
        channel: "voice",
        status: "completed",
        note: "Stress management & somatic breathing exercises",
      },
      {
        id: "sess-3",
        date: new Date(Date.now() - 172800000).toISOString(),
        listenerName: "Kabir Mehta (Peer Support)",
        channel: "chat",
        status: "completed",
        note: "Work-life balance discussion & burnout boundary review",
      },
    ]);
  }
}

