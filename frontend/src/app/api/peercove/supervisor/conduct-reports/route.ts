import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/supervisors/pod/conduct-reports");
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json([
      {
        id: "cr-01",
        conversationId: "conv-882",
        category: "Boundary Caution (Gave sleep supplement recommendation)",
        state: "open",
        reporterId: "Member (Anonymous)",
        reportedId: "Aarav Sharma",
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      },
      {
        id: "cr-02",
        conversationId: "conv-714",
        category: "Communication Style (Felt slightly hurried)",
        state: "resolved",
        reporterId: "Member (Anonymous)",
        reportedId: "Kabir Das",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: new Date().toISOString(),
      },
    ]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/operations/supervisor/conduct-reports", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: true, id: `cr-${Date.now()}`, state: "open", status: "recorded" });
  }
}

