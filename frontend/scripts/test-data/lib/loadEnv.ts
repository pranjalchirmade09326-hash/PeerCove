/**
 * Loads a named environment profile (local | hosted | ...) for the seed script.
 *
 * Profiles live at scripts/test-data/env/<name>.env (gitignored — copy from the
 * committed <name>.env.example and fill in real values) so pointing the script at
 * the hosted app instead of local dev is just `--env hosted`, never a code change.
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export interface SeedEnvConfig {
  betterAuthUrl: string;
  fhirGqlUrl: string;
  email: string;
  password: string;
  defaultPatientId?: number;
  defaultPractitionerId?: number;
}

export function loadEnvConfig(envName: string): SeedEnvConfig {
  const envPath = path.resolve(__dirname, "..", "env", `${envName}.env`);
  const examplePath = path.resolve(__dirname, "..", "env", `${envName}.env.example`);

  let parsed: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    parsed = dotenv.config({ path: envPath }).parsed ?? {};
  } else if (fs.existsSync(examplePath)) {
    parsed = dotenv.config({ path: examplePath }).parsed ?? {};
  }

  const betterAuthUrl =
    parsed.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:5001";
  const fhirGqlUrl =
    parsed.FHIR_GQL_URL || process.env.FHIR_GQL_URL || "http://localhost:8005/api/v1";
  const email =
    parsed.SEED_DOCTOR_EMAIL || process.env.SEED_DOCTOR_EMAIL || "doctor@peercove.com";
  const password =
    parsed.SEED_DOCTOR_PASSWORD || process.env.SEED_DOCTOR_PASSWORD || "password";
  const defaultPatientId =
    parsed.SEED_DEFAULT_PATIENT_ID || process.env.SEED_DEFAULT_PATIENT_ID
      ? Number(parsed.SEED_DEFAULT_PATIENT_ID || process.env.SEED_DEFAULT_PATIENT_ID)
      : 1;
  const defaultPractitionerId =
    parsed.SEED_DEFAULT_PRACTITIONER_ID || process.env.SEED_DEFAULT_PRACTITIONER_ID
      ? Number(parsed.SEED_DEFAULT_PRACTITIONER_ID || process.env.SEED_DEFAULT_PRACTITIONER_ID)
      : 1;

  return {
    betterAuthUrl,
    fhirGqlUrl,
    email,
    password,
    defaultPatientId,
    defaultPractitionerId,
  };
}
