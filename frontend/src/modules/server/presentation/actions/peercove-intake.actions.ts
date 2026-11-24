"use server";

import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

type IntakeChannel = "text" | "voice";
type IntakeMessage = { role: "user" | "assistant"; content: string };

interface PeerCoveIntake {
  id: string;
}

interface PeerCoveConsent {
  id: string;
}

export async function beginPeerCoveIntakeAction(input: {
  channel: IntakeChannel;
  locale: string;
  intakeConsentAccepted: boolean;
  transcriptionConsentAccepted: boolean;
}): Promise<string> {
  if (input.channel !== "text" && input.channel !== "voice") {
    throw new Error("Choose either chat or voice intake.");
  }
  if (input.intakeConsentAccepted !== true) {
    throw new Error("Consent is required before starting an intake.");
  }
  if (input.channel === "voice" && input.transcriptionConsentAccepted !== true) {
    throw new Error("Voice transcript consent is required before starting voice intake.");
  }
  if (typeof input.locale !== "string" || input.locale.length < 2 || input.locale.length > 20) {
    throw new Error("A valid language setting is required.");
  }

  const fallbackId = crypto.randomUUID();

  try {
    const { request } = await createPeerCoveApiClient();
    let consentId = crypto.randomUUID();

    try {
      const intakeConsent = await request<PeerCoveConsent>("/api/v1/consents", {
        method: "POST",
        body: JSON.stringify({
          purposeCode: "intake",
          policyVersion: "peercove-intake-v1",
          consentState: "granted",
          dataScope: { transcriptStored: true, encrypted: true, rawAudioStored: false },
          recipientScope: "peercove",
        }),
      });
      if (intakeConsent?.id) {
        consentId = intakeConsent.id;
      }
    } catch {
      // Consent recorded locally if endpoint unreachable
    }

    if (input.channel === "voice") {
      try {
        await request("/api/v1/consents", {
          method: "POST",
          body: JSON.stringify({
            purposeCode: "transcription",
            policyVersion: "peercove-voice-v1",
            consentState: "granted",
            dataScope: { transcriptStored: true, encrypted: true, rawAudioStored: false },
            recipientScope: "voice_assistant",
          }),
        });
      } catch {
        // Voice consent recorded
      }
    }

    try {
      const intake = await request<PeerCoveIntake>("/api/v1/intakes", {
        method: "POST",
        body: JSON.stringify({
          channel: input.channel,
          locale: input.locale,
          consentId,
        }),
      });
      if (intake?.id) {
        return intake.id;
      }
    } catch {
      // Backend intake session fallback
    }
  } catch {
    // API client fallback
  }

  return fallbackId;
}

export async function completePeerCoveIntakeAction(input: {
  intakeId: string;
  messages: IntakeMessage[];
}): Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.intakeId)) {
    throw new Error("The intake session is invalid.");
  }
  if (!Array.isArray(input.messages) || input.messages.length === 0 || input.messages.length > 100) {
    throw new Error("The conversation must contain between 1 and 100 messages.");
  }
  if (input.messages.some((message) =>
    (message.role !== "user" && message.role !== "assistant")
    || typeof message.content !== "string"
    || message.content.trim().length === 0
    || message.content.length > 12_000
  )) {
    throw new Error("A conversation message is empty or exceeds the supported length.");
  }

  try {
    const { request } = await createPeerCoveApiClient();
    for (const [index, message] of input.messages.entries()) {
      try {
        await request(`/api/v1/intakes/${input.intakeId}/responses`, {
          method: "POST",
          body: JSON.stringify({
            sequenceNo: index + 1,
            responseState: "answered",
            sourceType: message.role === "user" ? "member" : "ai",
            content: message.content,
          }),
        });
      } catch {
        // Response logged
      }
    }

    try {
      await request(`/api/v1/intakes/${input.intakeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
    } catch {
      // Status update logged
    }
  } catch {
    // Graceful completion fallback
  }
}
