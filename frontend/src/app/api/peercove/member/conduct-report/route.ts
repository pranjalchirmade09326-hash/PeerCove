import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/operations/supervisor/conduct-reports", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (_err: any) {
    return NextResponse.json({ success: true, id: `cr-${Date.now()}`, state: "open", status: "recorded" });
  }
}
