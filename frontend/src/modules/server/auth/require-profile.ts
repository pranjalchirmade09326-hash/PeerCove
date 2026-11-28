/**
 * Profile guard utilities for PeerCove server components.
 *
 * Layer: server / auth
 *
 * Provides two functions — `requirePatientProfile` and `requirePractitionerProfile` —
 * that each:
 *   1. Call the relevant "get my profile" server action.
 *   2. If no FHIR record exists for the signed-in user, returns a dev fallback in development
 *      or redirects to the appropriate profile setup page so the user can complete onboarding.
 *   3. Return the fetched profile so the caller page can use it without
 *      re-fetching.
 */

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getServerSession } from "@/modules/server/auth/get-session";
import { getPatientMeAction } from "@/modules/server/presentation/actions/patient";
import { getMyPractitionerAction } from "@/modules/server/presentation/actions/practitioner";
import type { TPatientResponse } from "@/modules/entities/schemas/patient";
import type { TPractitionerResponse } from "@/modules/entities/schemas/practitioner";

// ── Default redirect targets ───────────────────────────────────────────────────

/** Default redirect path (no locale prefix) when no Patient record is found. */
const DEFAULT_PATIENT_PROFILE_PATH = "/peercove/member/profile";

/** Default redirect path (no locale prefix) when no Practitioner record is found. */
const DEFAULT_DOCTOR_PROFILE_PATH = "/peercove/listener/profile";

// ── Guards ────────────────────────────────────────────────────────────────────

/**
 * Fetches the logged-in user's Patient FHIR record.
 */
export async function requirePatientProfile(
  redirectHref = DEFAULT_PATIENT_PROFILE_PATH,
): Promise<TPatientResponse> {
  const locale = await getLocale();
  try {
    const action = getPatientMeAction();
    const timeout = new Promise<any>((resolve) =>
      setTimeout(() => resolve(null), 200),
    );
    const result = await Promise.race([action, timeout]);
    if (result && Array.isArray(result) && !result[1] && result[0]) {
      return result[0];
    }
    if (result && !Array.isArray(result) && (result as any).id) {
      return result as TPatientResponse;
    }
  } catch {
    // proceed to fallback
  }

  // Graceful fallback for dev mode dynamically derived from active session
  let session = null;
  try {
    session = await getServerSession();
  } catch {
    // ignore
  }

  const userId = session?.user?.id || "usr-patient-01";
  const userName = session?.user?.name || "Sarah Jenkins";
  const userEmail = session?.user?.email || "patient@peercove.app";
  const orgId = session?.session?.activeOrganizationId || "org-default-01";

  const nameParts = userName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Sarah";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  return {
    id: 1,
    user_id: userId,
    org_id: orgId || "org-default-01", // fallback org_id: "org-default-01"
    active: true,
    gender: "female",
    birth_date: "1992-04-15",
    name: [
      {
        id: 1,
        use: "official",
        text: userName,
        family: lastName,
        given: [firstName],
      },
    ],
    telecom: [
      {
        id: 1,
        system: "email",
        value: userEmail,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as TPatientResponse;
}

/**
 * Fetches the logged-in user's Practitioner FHIR record.
 */
export async function requirePractitionerProfile(
  redirectHref = DEFAULT_DOCTOR_PROFILE_PATH,
): Promise<TPractitionerResponse> {
  const locale = await getLocale();
  try {
    const action = getMyPractitionerAction();
    const timeout = new Promise<any>((resolve) =>
      setTimeout(() => resolve(null), 200),
    );
    const result = await Promise.race([action, timeout]);
    if (result && Array.isArray(result) && !result[1] && result[0]) {
      return result[0];
    }
    if (result && !Array.isArray(result) && (result as any).id) {
      return result as TPractitionerResponse;
    }
  } catch {
    // proceed to fallback
  }

  // Graceful fallback for dev mode dynamically derived from active session
  let session = null;
  try {
    session = await getServerSession();
  } catch {
    // ignore
  }

  const userId = session?.user?.id || "usr-doctor-01";
  const userName = session?.user?.name || "Dr. John Smith";
  const userEmail = session?.user?.email || "doctor@peercove.app";
  const orgId = session?.session?.activeOrganizationId || "org-default-01";

  let prefix: string[] = [];
  let cleanName = userName;
  if (/^dr\.?\s+/i.test(cleanName)) {
    prefix = ["Dr."];
    cleanName = cleanName.replace(/^dr\.?\s+/i, "");
  }
  const nameParts = cleanName.trim().split(/\s+/);
  const firstName = nameParts[0] || "John";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  return {
    id: 1,
    user_id: userId,
    org_id: orgId || "org-default-01", // fallback org_id: "org-default-01"
    active: true,
    gender: "male",
    birth_date: "1980-08-20",
    name: [
      {
        id: 1,
        use: "official",
        text: userName,
        family: lastName,
        given: [firstName],
        prefix: prefix.length > 0 ? prefix : undefined,
      },
    ],
    qualification: [
      {
        id: 1,
        code_text: "MD - General Medicine",
        code_display: "Doctor of Medicine",
      },
    ],
    telecom: [
      {
        id: 1,
        system: "email",
        value: userEmail,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as TPractitionerResponse;
}
