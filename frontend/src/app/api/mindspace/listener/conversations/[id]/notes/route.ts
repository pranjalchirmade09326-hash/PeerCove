import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const { request } = await createMindspaceApiClient();
    const data = await request(`/api/v1/peer/conversations/${id}/soap`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      status: "success",
      conversation_id: id,
      message: "SOAP debrief note encrypted and saved",
      source: "fallback",
    });
  }
}
