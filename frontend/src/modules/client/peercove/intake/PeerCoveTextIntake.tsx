"use client";

import { PeerCoveIntakeGate } from "./PeerCoveIntakeGate";
import { TextIntake } from "./TextIntake";

export function PeerCoveTextIntake({
  locale,
  basePath,
  userName,
}: {
  locale: string;
  basePath: string;
  userName: string;
}) {
  return (
    <PeerCoveIntakeGate channel="text" locale={locale}>
      {(intakeId) => (
        <TextIntake intakeId={intakeId} basePath={basePath} userName={userName} />
      )}
    </PeerCoveIntakeGate>
  );
}
