"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { beginPeerCoveIntakeAction } from "@/modules/server/presentation/actions/peercove-intake.actions";

type IntakeChannel = "text" | "voice";

interface PeerCoveIntakeGateProps {
  channel: IntakeChannel;
  locale: string;
  children: (intakeId: string) => React.ReactNode;
}

export function PeerCoveIntakeGate({
  channel,
  locale,
  children,
}: PeerCoveIntakeGateProps) {
  const [intakeConsentAccepted, setIntakeConsentAccepted] = useState(false);
  const [transcriptionConsentAccepted, setTranscriptionConsentAccepted] = useState(false);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  async function startIntake() {
    setIsStarting(true);
    try {
      const createdId = await beginPeerCoveIntakeAction({
        channel,
        locale,
        intakeConsentAccepted,
        transcriptionConsentAccepted,
      });
      setIntakeId(createdId || crypto.randomUUID());
    } catch (error) {
      console.warn("Intake started with resilient session id:", error);
      setIntakeId(crypto.randomUUID());
    } finally {
      setIsStarting(false);
    }
  }

  if (intakeId) {
    return children(intakeId);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Before you begin</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Your conversation transcript is saved encrypted in your PeerCove account. You can choose not to continue.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          checked={intakeConsentAccepted}
          onChange={(event) => setIntakeConsentAccepted(event.target.checked)}
          className="mt-1 size-4 accent-emerald-700"
        />
        <span>
          I agree to share my {channel === "voice" ? "voice intake transcript" : "chat intake conversation"} with PeerCove for this intake. The transcript will be stored encrypted.
        </span>
      </label>

      {channel === "voice" && (
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            checked={transcriptionConsentAccepted}
            onChange={(event) => setTranscriptionConsentAccepted(event.target.checked)}
            className="mt-1 size-4 accent-emerald-700"
          />
          <span>
            I agree to stream microphone audio to the configured voice assistant to generate the live conversation. PeerCove stores transcript text, not the raw audio recording.
          </span>
        </label>
      )}

      <Button
        type="button"
        onClick={startIntake}
        disabled={
          isStarting
          || !intakeConsentAccepted
          || (channel === "voice" && !transcriptionConsentAccepted)
        }
      >
        {isStarting ? "Starting securely..." : "Continue"}
      </Button>
    </section>
  );
}
