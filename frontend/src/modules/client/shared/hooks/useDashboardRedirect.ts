/**
 * Dashboard Redirect Hook
 * Routes users to the appropriate dashboard based on their role after login
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/modules/client/auth/betterauth/auth-client";

interface DashboardConfig {
  member: string;
  listener: string;
  "listener-supervisor": string;
  "safety-operations": string;
  "platform-administrator": string;
  supervisor: string;
  safety: string;
  admin: string;
}

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  member: "/peercove/member",
  listener: "/peercove/listener",
  "listener-supervisor": "/peercove/listener-supervisor",
  "safety-operations": "/peercove/safety-operations",
  "platform-administrator": "/peercove/platform-administrator",
  supervisor: "/peercove/listener-supervisor",
  safety: "/peercove/safety-operations",
  admin: "/peercove/platform-administrator",
};

/**
 * Hook that automatically redirects users to their role-specific dashboard
 * @param config - Optional custom dashboard routes
 * @returns Object with redirect state and manual redirect function
 */
export const useDashboardRedirect = (config?: Partial<DashboardConfig>) => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const dashboardConfig = { ...DEFAULT_DASHBOARD_CONFIG, ...config };

  const redirectToDashboard = async (userRole?: string) => {
    if (!session || !session.user) {
      return;
    }

    // Get role from session metadata or custom field
    const role = (userRole || (session.user as any)?.role || "member")
      .toString()
      .toLowerCase()
      .replace(/_/g, "-");

    // Determine target dashboard
    const targetDashboard = (dashboardConfig as Record<string, string>)[role];

    if (targetDashboard) {
      // Small delay for smoother transition
      setTimeout(() => {
        router.push(targetDashboard);
      }, 300);
    } else {
      console.warn(`No dashboard configured for role: ${role}`);
      router.push(dashboardConfig.member); // Fallback to member dashboard
    }
  };

  // Auto-redirect when session is loaded
  useEffect(() => {
    if (!isPending && session?.user) {
      redirectToDashboard();
    }
  }, [session, isPending]);

  return {
    isLoading: isPending,
    redirectToDashboard,
    currentUser: session?.user || null,
  };
};

/**
 * Alternative server-side version for use in callbacks and server actions
 */
export async function getDashboardPath(userRole?: string): Promise<string> {
  const role = (userRole || "member").toLowerCase().replace(/_/g, "-");
  const dashboardMap: Record<string, string> = {
    member: "/peercove/member",
    listener: "/peercove/listener",
    "listener-supervisor": "/peercove/listener-supervisor",
    supervisor: "/peercove/listener-supervisor",
    "safety-operations": "/peercove/safety-operations",
    "safety-operations-specialist": "/peercove/safety-operations",
    safety: "/peercove/safety-operations",
    "platform-administrator": "/peercove/platform-administrator",
    admin: "/peercove/platform-administrator",
  };

  return dashboardMap[role] || dashboardMap.member;
}
