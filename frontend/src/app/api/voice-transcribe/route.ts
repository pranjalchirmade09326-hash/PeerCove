import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/modules/server/auth/jwt-token";

export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken().catch(() => null);
    const contentType = req.headers.get("content-type") || "";

    const agentBase = (process.env.INTAKE_VOICE_AGENT_URL || "http://127.0.0.1:8018").replace("localhost", "127.0.0.1");
    const transcribeUrl = `${agentBase.replace(/\/$/, "")}/api/v1/voice/transcribe`;

    let upstreamBody: any;
    const upstreamHeaders: Record<string, string> = {};

    if (token) {
      upstreamHeaders["Authorization"] = `Bearer ${token}`;
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      upstreamBody = formData;
    } else {
      const buffer = await req.arrayBuffer();
      upstreamBody = buffer;
      upstreamHeaders["Content-Type"] = contentType || "audio/webm";
    }

    const upstream = await fetch(transcribeUrl, {
      method: "POST",
      headers: upstreamHeaders,
      body: upstreamBody,
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.warn("[voice-transcribe] Upstream agent returned error:", upstream.status, errText);
      return NextResponse.json(
        { error: "Transcription failed", transcript: "" },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[voice-transcribe proxy error]:", error);
    return NextResponse.json(
      { error: "Transcription service unavailable", transcript: "" },
      { status: 500 }
    );
  }
}
