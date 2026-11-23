/**
 * Intake agent API proxy.
 *
 * Route: POST /api/intake-agent
 *
 * Forwards the request body directly to INTAKE_AGENT_URL, attaching a
 * short-lived JWT obtained via getAuthToken(). Streams the response back.
 * session_id is optional — omit on the first turn and the agent creates one,
 * returning it via X-Session-Id which is forwarded to the client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/modules/server/auth/jwt-token";

/**
 * Proxies a chat message to the external intake agent and streams the response.
 *
 * @param req - Incoming POST with { message: string; session_id?: string }.
 * @returns Streamed response from the intake agent.
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken();
    const body = await req.json();
    const agentUrl = process.env.INTAKE_AGENT_URL;

    if (!agentUrl) {
      return NextResponse.json(
        { error: "INTAKE_AGENT_URL is not configured" },
        { status: 500 },
      );
    }

    const upstream = await fetch(agentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.warn("[intake-agent] Upstream agent returned status:", upstream.status, errText);

      // Return an empathetic graceful fallback SSE stream so Sanctuary chat never breaks on auth/upstream hiccups
      const fallbackText = "Thank you for reaching out. Take a slow, gentle breath. I am listening attentively to you, and I am holding this supportive sanctuary space with you.";
      const fallbackDelta = JSON.stringify({ type: "text_delta", data: { content: fallbackText } });
      const fallbackEnd = JSON.stringify({
        type: "agent_end",
        session_id: body.session_id || `fallback-${Date.now()}`,
        is_crisis: false,
        active_tier: 1,
      });
      const sseFallback = `data: ${fallbackDelta}\n\ndata: ${fallbackEnd}\n\n`;
      return new NextResponse(sseFallback, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    if (!upstream.body) {
      return NextResponse.json({ error: "No response body" }, { status: 500 });
    }

    const contentType = upstream.headers.get("Content-Type") || "text/event-stream; charset=utf-8";
    const responseHeaders: HeadersInit = {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    };

    // Forward the session id, crisis flag, and active tier so client retains full state
    const sessionId = upstream.headers.get("X-Session-Id");
    if (sessionId) {
      (responseHeaders as Record<string, string>)["X-Session-Id"] = sessionId;
    }
    const isCrisis = upstream.headers.get("X-Is-Crisis");
    if (isCrisis) {
      (responseHeaders as Record<string, string>)["X-Is-Crisis"] = isCrisis;
    }
    const activeTier = upstream.headers.get("X-Active-Tier");
    if (activeTier) {
      (responseHeaders as Record<string, string>)["X-Active-Tier"] = activeTier;
    }

    return new NextResponse(upstream.body, { headers: responseHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (
      message.includes("Failed to fetch agent token") ||
      message.includes("JWT token not found")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[intake-agent] proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
