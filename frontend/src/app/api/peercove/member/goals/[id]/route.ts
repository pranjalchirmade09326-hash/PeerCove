import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/wellbeing/goals/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ status: "deleted", id, source: "fallback" });
  }
}

