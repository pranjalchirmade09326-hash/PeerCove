/**
 * MemberMatchRequestApi — Client service for member peer matching queue APIs.
 *
 * Layer: modules / client / mindspace / member / infrastructure / services
 */

import {
  MemberMatchRequestPayload,
  MemberMatchRequestResponse,
} from "../../domain/entities/MemberQueue";

export class MemberMatchRequestApi {
  /**
   * Submit a new match request into the queue.
   */
  static async createRequest(
    payload: MemberMatchRequestPayload
  ): Promise<MemberMatchRequestResponse> {
    const res = await fetch("/api/mindspace/member/match-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  /**
   * Poll current status of a match request.
   */
  static async getStatus(
    requestId: string
  ): Promise<MemberMatchRequestResponse> {
    const res = await fetch(
      `/api/mindspace/member/match-requests/${encodeURIComponent(requestId)}`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch status (${res.status})`);
    }

    return res.json();
  }

  /**
   * Cancel an active match request.
   */
  static async cancelRequest(
    requestId: string
  ): Promise<{ status: string; id: string }> {
    // Try primary cancel sub-route first
    let res = await fetch(
      `/api/mindspace/member/match-requests/${encodeURIComponent(requestId)}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    ).catch(() => null);

    // If primary returned 409 Conflict, do NOT fall back — throw immediately
    if (res && res.status === 409) {
      throw new Error("REQUEST_ALREADY_CLAIMED");
    }

    // Fall back to body-based cancel endpoint only if sub-route fails with network/500/404 error
    if (!res || (!res.ok && res.status !== 409)) {
      res = await fetch("/api/mindspace/member/match-request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId }),
      });
    }

    if (res && res.status === 409) {
      throw new Error("REQUEST_ALREADY_CLAIMED");
    }

    if (!res || !res.ok) {
      const err = res ? await res.json().catch(() => ({})) : {};
      throw new Error(err.error || `Failed to cancel request (${res?.status ?? "network error"})`);
    }

    return res.json();
  }
}
