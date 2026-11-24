import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/admin/kms/keys");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      keys: [
        {
          keyVersion: "v1",
          algorithm: "AES-256-GCM",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
}
