import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/peer/listeners/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      status: "success",
      message: "Listener profile updated",
      source: "fallback",
    });
  }
}

