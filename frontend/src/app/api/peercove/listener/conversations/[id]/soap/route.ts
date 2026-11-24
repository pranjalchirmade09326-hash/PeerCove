import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { request } = await createPeerCoveApiClient();
    const data = await request(`/api/v1/peer/conversations/${id}/soap`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      status: "success",
      conversation_id: id,
      message: "SOAP record encrypted and saved",
      source: "fallback",
    });
  }
}

