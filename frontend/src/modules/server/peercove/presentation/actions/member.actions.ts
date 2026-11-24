"server-only";

/**
 * Clean Architecture Presentation Server Actions for PeerCove Member.
 *
 * Layer: modules / server / peercove / presentation / actions
 */

import { z } from "zod";
import { loadMemberOverviewData } from "../../member-dashboard";
import { getServerSession } from "@/modules/server/auth/get-session";

export async function getMemberDashboardAction() {
  try {
    const data = await loadMemberOverviewData();
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to fetch member dashboard",
    };
  }
}

export async function submitMemberIntakeAction(payload: {
  channel: "chat" | "voice";
  topic?: string;
  notes?: string;
}) {
  try {
    const session = await getServerSession();
    return {
      success: true,
      intakeId: `intake-${Date.now()}`,
      userId: session?.user?.id || "anonymous-member",
      ...payload,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to submit intake",
    };
  }
}

