"use client";

/**
 * DemoRoleButtons — development-only sign-in shortcuts for the five
 * PeerCove roles. Each button POSTs to /api/auth/dev-login, which sets a
 * local session cookie, then navigates to that role's dashboard.
 *
 * Layer: client / peercove-dashboard
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { dashboardRoles } from "./dashboard-data";

const ROLE_IDS = [
  "member",
  "listener",
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
] as const;

export function DemoRoleButtons() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function signInAs(roleId: string) {
    setPending(roleId);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: roleId,
          email: `${roleId}@peercove.local`,
          name: roleId.replace(/[-_.]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          redirectUrl: `/peercove/${roleId}`,
        }),
      });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error ?? "Demo sign-in failed");
      }
      router.push(data.redirectUrl);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demo sign-in failed");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {ROLE_IDS.map((roleId) => {
        const role = dashboardRoles.find((item) => item.id === roleId);
        if (!role) return null;
        const Icon = role.icon;
        return (
          <button
            key={roleId}
            type="button"
            onClick={() => signInAs(roleId)}
            disabled={pending !== null}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <Icon className="size-4" aria-hidden="true" />
            {pending === roleId ? "Signing in…" : role.shortTitle}
          </button>
        );
      })}
    </div>
  );
}
