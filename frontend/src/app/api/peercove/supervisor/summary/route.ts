import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/operations/supervisor/summary");
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      activeListeners: 18,
      pendingApplications: 2,
      trainingDue: 3,
      openConductReports: 1,
      openConversations: 3,
    });
  }
}

