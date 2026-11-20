import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request(`/api/v1/peer/conversations/${id}/messages`);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([
      {
        id: `fallback-msg-${id}-1`,
        conversation_id: id,
        sender_user_id: "usr-demo-listener-01",
        content: "Hello! Thank you for connecting today. I'm here to listen without judgment. How are you feeling right now?",
        sent_at: new Date(Date.now() - 60000).toISOString(),
        source: "fallback",
      },
    ]);
  }
}

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
    const data = await request(`/api/v1/peer/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      id: `msg-${Date.now()}`,
      conversation_id: id,
      sender_user_id: body.sender_user_id || "usr-demo-member-01",
      content: typeof body?.content === "string" ? body.content : "",
      sent_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}
