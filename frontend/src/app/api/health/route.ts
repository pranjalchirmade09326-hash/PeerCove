import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.PEERCOVE_API_URL;
  let backendStatus = "unconfigured";

  if (backendUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${backendUrl}/health/ready`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      backendStatus = res.ok ? "healthy" : `status-${res.status}`;
    } catch {
      backendStatus = "waking_or_unreachable";
    }
  }

  return NextResponse.json({
    status: "ok",
    service: "peercove-frontend",
    backend: backendStatus,
    message: "PeerCove Next.js Web Application is running",
    dashboard: "/en/peercove/member",
    timestamp: new Date().toISOString(),
  });
}
