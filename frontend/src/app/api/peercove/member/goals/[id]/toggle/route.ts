import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/wellbeing/goals/${id}/toggle`, {
      method: "PUT",
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      id,
      status: "completed",
      source: "fallback",
    });
  }
}

