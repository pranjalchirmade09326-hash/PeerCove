import { describe, it, expect } from "vitest";
import {
  workspaceForRoles,
  normalizeRoleCode,
  parseRoles,
  peercoveRoleWorkspaces,
} from "@/modules/client/peercove-dashboard/role-map";

describe("Milestone 5: Role Workspace Navigation & Normalization", () => {
  describe("Role Normalization (normalizeRoleCode)", () => {
    it("normalizes member and patient to member", () => {
      expect(normalizeRoleCode("member")).toBe("member");
      expect(normalizeRoleCode("patient")).toBe("member");
    });

    it("normalizes listener and doctor to listener", () => {
      expect(normalizeRoleCode("listener")).toBe("listener");
      expect(normalizeRoleCode("doctor")).toBe("listener");
    });

    it("normalizes supervisor hyphenated, underscored and short forms", () => {
      expect(normalizeRoleCode("listener-supervisor")).toBe("listener_supervisor");
      expect(normalizeRoleCode("listener_supervisor")).toBe("listener_supervisor");
      expect(normalizeRoleCode("supervisor")).toBe("listener_supervisor");
    });

    it("normalizes safety operations hyphenated, underscored and short forms", () => {
      expect(normalizeRoleCode("safety-operations")).toBe("safety_operations_specialist");
      expect(normalizeRoleCode("safety_operations")).toBe("safety_operations_specialist");
      expect(normalizeRoleCode("safety_operations_specialist")).toBe("safety_operations_specialist");
      expect(normalizeRoleCode("safety")).toBe("safety_operations_specialist");
    });

    it("normalizes platform admin hyphenated, underscored and short forms", () => {
      expect(normalizeRoleCode("platform-administrator")).toBe("platform_administrator");
      expect(normalizeRoleCode("platform_administrator")).toBe("platform_administrator");
      expect(normalizeRoleCode("admin")).toBe("platform_administrator");
    });

    it("returns null for invalid or null role inputs", () => {
      expect(normalizeRoleCode(null)).toBeNull();
      expect(normalizeRoleCode(undefined)).toBeNull();
      expect(normalizeRoleCode("")).toBeNull();
      expect(normalizeRoleCode("unknown_role_xyz")).toBeNull();
    });
  });

  describe("Role Parsing (parseRoles)", () => {
    it("parses comma-separated role strings into normalized role codes", () => {
      const parsed = parseRoles("member, listener-supervisor, admin");
      expect(parsed).toEqual([
        "member",
        "listener_supervisor",
        "platform_administrator",
      ]);
    });

    it("handles empty or null values gracefully", () => {
      expect(parseRoles(null)).toEqual([]);
      expect(parseRoles("")).toEqual([]);
    });
  });

  describe("Workspace Routing (workspaceForRoles)", () => {
    it("routes member to member workspace", () => {
      expect(workspaceForRoles("member")).toBe("/peercove/member");
      expect(workspaceForRoles("member", "en")).toBe("/en/peercove/member");
      expect(workspaceForRoles("member", "hi")).toBe("/hi/peercove/member");
      expect(workspaceForRoles("member", "ta")).toBe("/ta/peercove/member");
    });

    it("routes listener to listener workspace", () => {
      expect(workspaceForRoles("listener")).toBe("/peercove/listener");
      expect(workspaceForRoles("listener", "en")).toBe("/en/peercove/listener");
      expect(workspaceForRoles("listener", "hi")).toBe("/hi/peercove/listener");
    });

    it("routes listener_supervisor and listener-supervisor to canonical listener-supervisor workspace", () => {
      expect(workspaceForRoles("listener_supervisor")).toBe("/peercove/listener-supervisor");
      expect(workspaceForRoles("listener-supervisor")).toBe("/peercove/listener-supervisor");
      expect(workspaceForRoles("supervisor")).toBe("/peercove/listener-supervisor");
      expect(workspaceForRoles("listener_supervisor", "en")).toBe("/en/peercove/listener-supervisor");
      expect(workspaceForRoles("listener-supervisor", "en")).toBe("/en/peercove/listener-supervisor");
    });

    it("routes safety_operations_specialist and safety-operations to canonical safety-operations workspace", () => {
      expect(workspaceForRoles("safety_operations_specialist")).toBe("/peercove/safety-operations");
      expect(workspaceForRoles("safety-operations")).toBe("/peercove/safety-operations");
      expect(workspaceForRoles("safety")).toBe("/peercove/safety-operations");
      expect(workspaceForRoles("safety_operations_specialist", "en")).toBe("/en/peercove/safety-operations");
      expect(workspaceForRoles("safety-operations", "en")).toBe("/en/peercove/safety-operations");
    });

    it("routes platform_administrator and platform-administrator to canonical platform-administrator workspace", () => {
      expect(workspaceForRoles("platform_administrator")).toBe("/peercove/platform-administrator");
      expect(workspaceForRoles("platform-administrator")).toBe("/peercove/platform-administrator");
      expect(workspaceForRoles("admin")).toBe("/peercove/platform-administrator");
      expect(workspaceForRoles("platform_administrator", "en")).toBe("/en/peercove/platform-administrator");
      expect(workspaceForRoles("platform-administrator", "en")).toBe("/en/peercove/platform-administrator");
    });

    it("prioritizes highest privilege role when multiple roles are passed", () => {
      expect(workspaceForRoles("member, platform-administrator")).toBe("/peercove/platform-administrator");
      expect(workspaceForRoles("member, listener-supervisor")).toBe("/peercove/listener-supervisor");
      expect(workspaceForRoles("listener, safety-operations")).toBe("/peercove/safety-operations");
    });

    it("defaults to member workspace when role is undefined or empty", () => {
      expect(workspaceForRoles(null)).toBe("/peercove/member");
      expect(workspaceForRoles(undefined)).toBe("/peercove/member");
      expect(workspaceForRoles("")).toBe("/peercove/member");
      expect(workspaceForRoles(null, "en")).toBe("/en/peercove/member");
    });
  });
});
