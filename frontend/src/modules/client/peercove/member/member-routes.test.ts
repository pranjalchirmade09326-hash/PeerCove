import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as journalPOST, GET as journalGET } from "@/app/api/peercove/member/journal/route";
import { POST as moodsPOST, GET as moodsGET } from "@/app/api/peercove/member/moods/route";
import { POST as goalsPOST, GET as goalsGET } from "@/app/api/peercove/member/goals/route";
import { POST as peerSessionPOST } from "@/app/api/peercove/member/peer-session/route";
import { POST as matchRequestsPOST, GET as matchRequestsGET } from "@/app/api/peercove/member/match-requests/route";
import { GET as matchRequestGetById, POST as matchRequestDirectCancelPOST } from "@/app/api/peercove/member/match-requests/[id]/route";
import { POST as matchRequestCancelByIdPOST } from "@/app/api/peercove/member/match-requests/[id]/cancel/route";
import { POST as matchRequestCancelPOST } from "@/app/api/peercove/member/match-request/cancel/route";
import * as apiClientModule from "@/modules/server/peercove/api-client";

vi.mock("@/modules/server/peercove/api-client", () => ({
  createPeerCoveApiClient: vi.fn(),
}));

describe("Member Next.js Route Handlers - Resiliency & Stream Consumption Fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/peercove/member/journal", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "j-backend", title: "Saved" });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My Reflection", body: "Peaceful day" }),
      });

      const res = await journalPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("j-backend");
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/wellbeing/journal",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("gracefully falls back when backend is offline without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("FastAPI offline: ECONNREFUSED")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Offline Entry", body: "Still saved locally" }),
      });

      const res = await journalPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.title).toBe("Offline Entry");
      expect(json.body).toBe("Still saved locally");
    });

    it("handles malformed JSON request body without crashing", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{malformed-json",
      });

      const res = await journalPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.title).toBe("Personal Reflection");
    });

    it("GET returns fallback data when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );
      const res = await journalGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/peercove/member/moods", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "m-backend", mood_code: "calm" });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood_code: "calm", scale_value: 8.5 }),
      });

      const res = await moodsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("m-backend");
    });

    it("gracefully falls back when backend fails without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("FastAPI offline")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood_code: "grateful", scale_value: 9.0, note: "Feeling good" }),
      });

      const res = await moodsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.mood_code).toBe("grateful");
      expect(json.scale_value).toBe(9.0);
      expect(json.note).toBe("Feeling good");
    });

    it("handles malformed JSON request body gracefully", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await moodsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.mood_code).toBe("calm");
    });

    it("GET returns fallback data when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );
      const res = await moodsGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/peercove/member/goals", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "g-backend", goal: "Mindfulness" });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: "Mindfulness practice", target_date: "2026-12-01" }),
      });

      const res = await goalsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("g-backend");
    });

    it("gracefully falls back when backend fails without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("FastAPI offline")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: "Drink water daily", target_date: "2026-11-30" }),
      });

      const res = await goalsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.goal).toBe("Drink water daily");
      expect(json.target_date).toBe("2026-11-30");
    });

    it("handles malformed JSON request body gracefully", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await goalsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.goal).toBe("Personal Wellbeing Goal");
    });

    it("GET returns fallback data when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend offline")
      );
      const res = await goalsGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/peercove/member/peer-session", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "sess-backend", status: "confirmed" });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listener_name: "John", channel: "video", note: "Need support" }),
      });

      const res = await peerSessionPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("sess-backend");
    });

    it("gracefully falls back when backend fails without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("FastAPI offline")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listener_name: "Maya Patel", channel: "chat", note: "Anxiety support" }),
      });

      const res = await peerSessionPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.listenerName).toBe("Maya Patel");
      expect(json.channel).toBe("chat");
      expect(json.note).toBe("Anxiety support");
    });

    it("handles malformed JSON request body gracefully", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await peerSessionPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.listenerName).toBe("Aarav Sharma (Verified Peer Listener)");
    });
  });

  describe("Member Match Request Route Handlers (Milestone 2)", () => {
    it("POST /api/peercove/member/match-requests returns backend response on success", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        id: "mr-backend-101",
        request_state: "queued",
        support_topic: "anxiety",
      });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_topic: "anxiety",
          preferred_channel: "voice",
          preferred_languages: ["en"],
          consent_share_intake: true,
          notes: "Need somatic grounding",
        }),
      });

      const res = await matchRequestsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("mr-backend-101");
      expect(json.request_state).toBe("queued");
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/peer/match-requests",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("POST /api/peercove/member/match-requests rejects invalid support topic with 400", async () => {
      const req = new Request("http://localhost:4000/api/peercove/member/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_topic: "invalid-medical-diagnosis",
        }),
      });

      const res = await matchRequestsPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("POST /api/peercove/member/match-requests rejects empty string support topic with 400 Bad Request", async () => {
      const req = new Request("http://localhost:4000/api/peercove/member/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_topic: "",
        }),
      });

      const res = await matchRequestsPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Topic cannot be empty");
    });

    it("POST /api/peercove/member/match-requests falls back gracefully when backend is offline", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend unreachable")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_topic: "stress",
          channel: "video",
          notes: "Work burnout",
        }),
      });

      const res = await matchRequestsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.request_state).toBe("queued");
      expect(json.support_topic).toBe("stress");
      expect(json.preferred_channel).toBe("video");
    });

    it("GET /api/peercove/member/match-requests returns match requests list", async () => {
      const mockRequest = vi.fn().mockResolvedValue([
        { id: "mr-1", request_state: "queued" },
      ]);
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const res = await matchRequestsGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.length).toBe(1);
    });

    it("GET /api/peercove/member/match-requests/[id] retrieves match request status with fallback", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend unreachable")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/match-requests/mr-999");
      const res = await matchRequestGetById(req, {
        params: Promise.resolve({ id: "mr-999" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("mr-999");
      expect(json.request_state).toBe("queued");
    });

    it("POST /api/peercove/member/match-requests/[id]/cancel cancels match request with fallback", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend unreachable")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/match-requests/mr-999/cancel", {
        method: "POST",
      });
      const res = await matchRequestCancelByIdPOST(req, {
        params: Promise.resolve({ id: "mr-999" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("mr-999");
      expect(json.status).toBe("cancelled");
    });

    it("POST /api/peercove/member/match-request/cancel cancels via body parameter", async () => {
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockRejectedValue(
        new Error("Backend unreachable")
      );

      const req = new Request("http://localhost:4000/api/peercove/member/match-request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "mr-888" }),
      });
      const res = await matchRequestCancelPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("mr-888");
      expect(json.status).toBe("cancelled");
    });

    it("POST /api/peercove/member/match-request/cancel returns 409 Conflict when already claimed by listener", async () => {
      const error: any = new Error("REQUEST_ALREADY_CLAIMED");
      error.status = 409;
      error.detail = "REQUEST_ALREADY_CLAIMED";
      const mockRequest = vi.fn().mockRejectedValue(error);
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/match-request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "mr-claimed-fallback" }),
      });
      const res = await matchRequestCancelPOST(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.detail).toBe("REQUEST_ALREADY_CLAIMED");
      expect(json.error).toBe("Request already claimed by listener");
    });

    it("POST /api/peercove/member/match-requests/[id] directly cancels match request", async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        id: "mr-direct-1",
        status: "cancelled",
      });
      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/match-requests/mr-direct-1", {
        method: "POST",
      });
      const res = await matchRequestDirectCancelPOST(req, {
        params: Promise.resolve({ id: "mr-direct-1" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("cancelled");
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/peer/match-requests/mr-direct-1/cancel",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("POST /api/peercove/member/match-requests/[id]/cancel returns 409 when already claimed", async () => {
      const error: any = new Error("REQUEST_ALREADY_CLAIMED");
      error.status = 409;
      error.detail = "REQUEST_ALREADY_CLAIMED";
      const mockRequest = vi.fn().mockRejectedValue(error);

      vi.mocked(apiClientModule.createPeerCoveApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/peercove/member/match-requests/mr-claimed-1/cancel", {
        method: "POST",
      });
      const res = await matchRequestCancelByIdPOST(req, {
        params: Promise.resolve({ id: "mr-claimed-1" }),
      });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toBe("REQUEST_ALREADY_CLAIMED");
    });

    it("GET /api/peercove/member/match-requests/[id] returns 404 for invalid-id", async () => {
      const req = new Request("http://localhost:4000/api/peercove/member/match-requests/invalid-id");
      const res = await matchRequestGetById(req, {
        params: Promise.resolve({ id: "invalid-id" }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Invalid match request ID");
    });
  });
});
