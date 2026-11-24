"use server";

import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export interface PeerCoveAccountProfile {
  userId: string;
  roles: string[];
}

// Creates the PeerCove member principal on first sign-in and returns the
// application roles held in the API's own authorization store. The IAM role
// claim is never used to grant privileges here.
export async function provisionPeerCoveAccountAction(): Promise<PeerCoveAccountProfile> {
  const { request } = await createPeerCoveApiClient();
  return request<PeerCoveAccountProfile>("/api/v1/me");
}
