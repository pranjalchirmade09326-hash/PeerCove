import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as activeMatchRequestsGET } from "@/app/api/peercove/listener/match-requests/active/route";
import { POST as offerAcceptPOST } from "@/app/api/peercove/listener/offers/[id]/accept/route";
import { POST as offerDeclinePOST } from "@/app/api/peercove/listener/offers/[id]/decline/route";
import { POST as matchRequestAcceptPOST } from "@/app/api/peercove/listener/match-requests/[id]/accept/route";
import { POST as matchRequestDeclinePOST } from "@/app/api/peercove/listener/match-requests/[id]/decline/route";
import { GET as availabilityGET, POST as availabilityPOST } from "@/app/api/peercove/listener/availability/route";
import { PUT as listenerProfilePUT } from "@/app/api/peercove/listener/profile/route";
import { GET as listenerSummaryGET } from "@/app/api/peercove/listener/summary/route";
import * as apiClientModule from "@/modules/server/peercove/api-client";

vi.mock("@/modules/server/peercove/api-client", () => ({
  createPeerCoveApiClient: vi.fn(),
}));

describe("Listener Next.js Route Handlers (Milestone 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. GET /api/peercove/listener/match-requests/active
  // ==========================================================================
  describe("GET /api/peercove/listener/match-requests/active", () => {
    it("returns active queued requests from backend on success", async () => {
      const mockData = [
        {
          id: "req-101",
          member_id: "usr-mem-1",
          member_name: "Ananya",
          support_topic: "anxiety",
          preferred_channel: "video",
          created_at: new Date().toISOString(),
          waiting_minutes: 4,
          urgency: "routine",
        },
      ];
      const mockRequest = vi.fn().mockResolvedValue(mockData);
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const res = await activeMatchRequestsGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveLength(1);
      expect(json[0].id).toBe("req-101");
      expect(mockRequest).toHaveBeenCalledWith("/api/v1/peer/match-requests/active");
    });

    it("returns resilient fallback queue data when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend unreachable")
      );

      const res = await activeMatchRequestsGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
      expect(json[0]).toHaveProperty("support_topic");
      expect(json[0]).toHaveProperty("waiting_minutes");
    });
  });

  // ==========================================================================
  // 2. POST /api/peercove/listener/offers/[id]/accept
  // ==========================================================================
  describe("POST /api/peercove/listener/offers/[id]/accept", () => {
    it("returns 200 OK with accepted status and conversation_id on success", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        status: "accepted",
        match_id: "match-01",
        conversation_id: "conv-01",
        channel: "chat",
      });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "chat" }),
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("accepted");
      expect(json.conversation_id).toBe("conv-01");
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/peer/match-requests/req-101/accept",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("returns 409 Conflict when request was already claimed (Race Condition)", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: vi.fn().mockRejectedValue(new Error("409: REQUEST_ALREADY_CLAIMED")),
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.detail).toBe("REQUEST_ALREADY_CLAIMED");
    });

    it("returns 409 Conflict when request was cancelled by member", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: vi.fn().mockRejectedValue(new Error("409: REQUEST_CANCELLED")),
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.detail).toBe("REQUEST_CANCELLED");
    });

    it("returns 409 Conflict when request expired", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: vi.fn().mockRejectedValue(new Error("409: REQUEST_EXPIRED")),
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.detail).toBe("REQUEST_EXPIRED");
    });

    it("returns 400 Bad Request when listener is at capacity limit", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: vi.fn().mockRejectedValue(new Error("400: CAPACITY_LIMIT_EXCEEDED")),
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.detail).toBe("CAPACITY_LIMIT_EXCEEDED");
    });

    it("returns 400 Bad Request when listener is offline", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: vi.fn().mockRejectedValue(new Error("400: LISTENER_OFFLINE")),
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.detail).toBe("LISTENER_OFFLINE");
    });

    it("returns 404 Not Found when offer is not found", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: vi.fn().mockRejectedValue(new Error("404: OFFER_NOT_FOUND")),
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.detail).toBe("OFFER_NOT_FOUND");
    });

    it("returns 400 Bad Request for invalid offer ID", async () => {
      const req = new Request("http://localhost:4000/api/peercove/listener/offers/invalid/accept", {
        method: "POST",
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "invalid" }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.detail).toBe("INVALID_OFFER_ID");
    });

    it("provides resilient fallback response when backend is offline", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "video" }),
      });

      const res = await offerAcceptPOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.status).toBe("accepted");
    });
  });

  // ==========================================================================
  // 3. POST /api/peercove/listener/offers/[id]/decline
  // ==========================================================================
  describe("POST /api/peercove/listener/offers/[id]/decline", () => {
    it("returns 200 OK with declined status on backend success", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ status: "declined", reassigned: true });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "off_shift" }),
      });

      const res = await offerDeclinePOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("declined");
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/peer/match-requests/req-101/decline",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("returns 400 Bad Request for invalid offer ID", async () => {
      const req = new Request("http://localhost:4000/api/peercove/listener/offers/invalid-id/decline", {
        method: "POST",
      });

      const res = await offerDeclinePOST(req, {
        params: Promise.resolve({ id: "invalid-id" }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.detail).toBe("INVALID_OFFER_ID");
    });

    it("returns resilient fallback on backend failure", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );

      const req = new Request("http://localhost:4000/api/peercove/listener/offers/req-101/decline", {
        method: "POST",
      });

      const res = await offerDeclinePOST(req, {
        params: Promise.resolve({ id: "req-101" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("declined");
      expect(json.source).toBe("fallback");
    });
  });

  // ==========================================================================
  // 4. POST match-requests/[id]/accept and decline aliases
  // ==========================================================================
  describe("POST /api/peercove/listener/match-requests/[id]/accept and decline aliases", () => {
    it("match-requests/[id]/accept functions identically to offers/[id]/accept", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ status: "accepted", match_id: "m-123" });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "listener-1" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/match-requests/req-123/accept", {
        method: "POST",
      });
      const res = await matchRequestAcceptPOST(req, {
        params: Promise.resolve({ id: "req-123" }),
      });
      expect(res.status).toBe(200);
    });

    it("match-requests/[id]/decline functions identically to offers/[id]/decline", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ status: "declined" });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/match-requests/req-123/decline", {
        method: "POST",
      });
      const res = await matchRequestDeclinePOST(req, {
        params: Promise.resolve({ id: "req-123" }),
      });
      expect(res.status).toBe(200);
    });
  });

  // ==========================================================================
  // 5. Availability Endpoint (GET & POST)
  // ==========================================================================
  describe("Availability Endpoint (/api/peercove/listener/availability)", () => {
    it("GET returns current availability and workload metrics on backend success", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        active_now: true,
        capacityLimit: 3,
        openConversations: 1,
      });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const res = await availabilityGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("success");
      expect(json.is_available).toBe(true);
      expect(json.capacityLimit).toBe(3);
      expect(json.openConversations).toBe(1);
    });

    it("GET returns resilient fallback when backend is offline", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );

      const res = await availabilityGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("success");
      expect(json.source).toBe("fallback");
      expect(typeof json.is_available).toBe("boolean");
    });

    it("POST toggles availability via backend toggle-active endpoint", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        status: "success",
        active_now: true,
        is_online: true,
      });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/availability", {
        method: "POST",
      });
      const res = await availabilityPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("success");
      expect(json.is_available).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/listeners/me/toggle-active",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("POST toggles availability locally with fallback when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );

      const req = new Request("http://localhost:4000/api/peercove/listener/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_now: false }),
      });
      const res = await availabilityPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("success");
      expect(json.source).toBe("fallback");
      expect(json.is_available).toBe(false);
    });
  });

  // ==========================================================================
  // 6. Profile and Summary Endpoints
  // ==========================================================================
  describe("Profile and Summary Endpoints", () => {
    it("PUT /api/peercove/listener/profile persists online status", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ status: "success", active_now: true });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/listener/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_now: true }),
      });
      const res = await listenerProfilePUT(req);
      expect(res.status).toBe(200);
    });

    it("GET /api/peercove/listener/summary exposes capacityLimit and openConversations on success", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        applicationState: "approved",
        eligibilityState: "eligible",
        capacityLimit: 3,
        openConversations: 2,
        openOffers: 1,
        empathyRating: 4.9,
      });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        request: mockRequest,
      } as any);

      const res = await listenerSummaryGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("capacityLimit");
      expect(json).toHaveProperty("openConversations");
      expect(mockRequest).toHaveBeenCalledWith("/api/v1/listeners/me/summary");
    });

    it("GET /api/peercove/listener/summary returns fallback values when backend fails", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );
      const res = await listenerSummaryGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("capacityLimit");
      expect(json).toHaveProperty("openConversations");
    });
  });
});
