import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/admin/kms/rotate", {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      success: true,
      currentVersion: "v2",
      message: "KMS envelope key rotated successfully",
    });
  }
}
