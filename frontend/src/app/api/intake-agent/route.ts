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

function buildContextualFallback(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("breath") || lower.includes("4-7-8") || lower.includes("ground")) {
    return "Let's do a gentle 4-7-8 grounding breath together:\n\n1. **Inhale quietly** through your nose for **4 seconds**.\n2. **Hold gently** for **7 seconds**.\n3. **Exhale slowly** through your mouth for **8 seconds**.\n\nNotice your shoulders dropping a little. Would you like to do another round or talk through what's weighing on you?";
  }
  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("night") || lower.includes("tired")) {
    return "Disrupted sleep and racing thoughts at night can feel exhausting. Let's take a moment to unpack what's keeping your mind active — is it work stress, emotional overwhelm, or physical tension? You can also connect with a verified Peer Listener if you'd like to talk it through.";
  }
  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("stress") || lower.includes("burnout") || lower.includes("overwhelm")) {
    return "I hear how heavy that stress and overwhelm feel right now. You don't have to carry it all at once. Tell me what feels most pressing today, or we can schedule a 1-on-1 session with a verified Peer Listener whenever you're ready.";
  }
  if (lower.includes("listener") || lower.includes("peer") || lower.includes("schedule") || lower.includes("book") || lower.includes("session")) {
    return "I can help you connect with a verified Peer Listener or schedule a support session. Click **Schedule Session** above or the booking button below to pick a format (Video, Voice, or Text Chat) and time that works for you.";
  }
  return "Thank you for sharing that with me. Take a slow, gentle breath — I am listening attentively, and this is a safe, private space. What feels most important for you to explore right now?";
}

function createSseFallbackResponse(text: string, sessionId?: string) {
  const fallbackDelta = JSON.stringify({ type: "text_delta", data: { content: text } });
  const fallbackEnd = JSON.stringify({
    type: "agent_end",
    session_id: sessionId || `fallback-${Date.now()}`,
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

/**
 * Proxies a chat message to the external intake agent and streams the response.
 *
 * @param req - Incoming POST with { message: string; session_id?: string }.
 * @returns Streamed response from the intake agent.
 */
export async function POST(req: NextRequest) {
  let body: { message?: string; session_id?: string } = {};
  try {
    body = await req.json();
    const token = await getAuthToken().catch(() => null);
    const agentUrl = process.env.INTAKE_AGENT_URL;

    if (!agentUrl) {
      return createSseFallbackResponse(
        buildContextualFallback(body.message || ""),
        body.session_id,
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const upstream = await fetch(agentUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.warn("[intake-agent] Upstream agent returned status:", upstream.status, errText);
      return createSseFallbackResponse(
        buildContextualFallback(body.message || ""),
        body.session_id,
      );
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
    console.warn("[intake-agent] Upstream unreachable, serving contextual fallback:", err);
    return createSseFallbackResponse(
      buildContextualFallback(body.message || ""),
      body.session_id,
    );
  }
}
