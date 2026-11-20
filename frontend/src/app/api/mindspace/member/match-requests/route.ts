import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";
import {
  validateTopic,
  validateChannel,
  validateLanguages,
  sanitizeNotes,
} from "@/modules/client/mindspace/member/domain/entities/MemberQueue";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/peer/match-requests");
    return NextResponse.json(data);
  } catch (_error: any) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const topicInput =
    body.support_topic !== undefined
      ? body.support_topic
      : body.supportTopic !== undefined
        ? body.supportTopic
        : "general";
  const topicResult = validateTopic(topicInput);
  if (!topicResult.valid) {
    return NextResponse.json({ error: topicResult.error }, { status: 400 });
  }

  const channelInput = body.preferred_channel || body.channel || body.preferredChannel || "chat";
  const channelResult = validateChannel(channelInput);
  if (!channelResult.valid) {
    return NextResponse.json({ error: channelResult.error }, { status: 400 });
  }

  const languages = validateLanguages(body.preferred_languages || body.languages);
  const consent = Boolean(body.consent_share_intake);
  const notes = sanitizeNotes(body.notes);

  try {
    const { request, identity } = await createMindspaceApiClient();
    const data = await request("/api/v1/peer/match-requests", {
      method: "POST",
      body: JSON.stringify({
        support_topic: topicResult.normalized,
        preferred_channel: channelResult.normalized,
        preferred_languages: languages,
        consent_share_intake: consent,
        notes,
      }),
    });
    return NextResponse.json(data);
  } catch (_err: any) {
    // Graceful offline fallback
    return NextResponse.json({
      id: `mr-${Date.now()}`,
      member_id: "usr-member-01",
      request_state: "queued",
      support_topic: topicResult.normalized,
      preferred_channel: channelResult.normalized,
      preferred_languages: languages,
      consent_share_intake: consent,
      notes,
      created_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}
