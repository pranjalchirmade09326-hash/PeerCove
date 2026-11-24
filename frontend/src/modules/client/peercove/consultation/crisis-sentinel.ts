import type { CrisisSentinelResult } from "./types";

export const CRISIS_REGEX =
  /\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die|hang\s+myself|shoot\s+myself|slit\s+my\s+wrists?|hurt\s+myself|self[- ]*harm|overdose)\b/i;

export const TELE_MANAS_HELPLINE = "14416 / +91 9999 666 555";
export const US_988_HELPLINE = "988";
export const EMERGENCY_112 = "112";
export const KIRAN_HELPLINE = "1800-599-0019";

/**
 * Deterministic Crisis Sentinel Check (<2ms pre-inference tripwire)
 */
export function checkCrisisSentinel(messageText: string): CrisisSentinelResult {
  const start = performance.now();
  const match = CRISIS_REGEX.exec(messageText);
  const latency = performance.now() - start;

  if (match) {
    return {
      isCrisis: true,
      detectionLatencyMs: latency,
      helplines: {
        teleManas: TELE_MANAS_HELPLINE,
        crisisLine988: US_988_HELPLINE,
        emergency112: EMERGENCY_112,
      },
      matchedPhrase: match[0],
    };
  }

  return {
    isCrisis: false,
    detectionLatencyMs: latency,
  };
}
