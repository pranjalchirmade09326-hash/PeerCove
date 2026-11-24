"use client";

import { PeerCoveIntakeGate } from "./PeerCoveIntakeGate";
import { VoiceIntakeTest } from "./VoiceIntakeTest";

export function PeerCoveVoiceIntake({
  locale,
  basePath,
  userName,
}: {
  locale: string;
  basePath: string;
  userName: string;
}) {
  return (
    <PeerCoveIntakeGate channel="voice" locale={locale}>
      {(intakeId) => (
        <VoiceIntakeTest intakeId={intakeId} basePath={basePath} userName={userName} />
      )}
    </PeerCoveIntakeGate>
  );
}
