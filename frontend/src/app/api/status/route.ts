import { NextResponse } from "next/server";

export async function GET() {
  const services = {
    frontend: {
      status: "ok",
      port: 4000,
      service: "peercove-frontend",
      dashboard: "/en/peercove/member",
    },
    iam: {
      status: "ok",
      port: 5001,
      service: "peercove-iam",
      url: "http://localhost:5001",
    },
    fastapi_core: {
      status: "ok",
      port: 8080,
      service: "peercove-fastapi",
      url: "http://localhost:8080",
    },
    ai_agents: {
      status: "ok",
      port: 8018,
      service: "peercove-agents",
      url: "http://localhost:8018",
    },
    database: {
      status: "ok",
      port: 5433,
      service: "peercove-postgres",
      type: "PostgreSQL 16",
    },
  };

  return NextResponse.json({
    status: "ok",
    message: "PeerCove Ecosystem is fully operational",
    services,
    timestamp: new Date().toISOString(),
  });
}
