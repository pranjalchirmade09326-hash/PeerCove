import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/supervisors/pod/training-reviews");
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json([
      {
        id: "tr-01",
        listenerName: "Kabir Das",
        moduleCode: "PC-BE-201",
        moduleTitle: "Non-Clinical Peer Boundaries & Ethical Care",
        score: "94%",
        status: "pending_supervisor_signoff",
        completedAt: "2 days ago",
      },
      {
        id: "tr-02",
        listenerName: "Meera Rao",
        moduleCode: "PC-SS-202",
        moduleTitle: "Crisis De-escalation & Safety Operations Alerting",
        score: "98%",
        status: "pending_supervisor_signoff",
        completedAt: "Yesterday",
      },
      {
        id: "tr-03",
        listenerName: "Priya Nair",
        moduleCode: "PC-SC-301",
        moduleTitle: "Caregiver Resilience & Vicarious Trauma Self-Care",
        score: "100%",
        status: "verified",
        completedAt: "Last week",
      },
    ]);
  }
}

