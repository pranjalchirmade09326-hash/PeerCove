import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/operations/safety/followups");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([
      {
        id: "fol-01",
        caseId: "case-872",
        memberId: "mbr-612",
        status: "scheduled",
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
        notes: "24-hour post-sentinel reassurance check-in.",
      },
    ]);
  }
}
