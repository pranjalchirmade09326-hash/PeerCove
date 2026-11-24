import { NextResponse } from "next/server";
import { createPeerCoveApiClient } from "@/modules/server/peercove/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createPeerCoveApiClient();
    const data = await request("/api/v1/supervisors/pod/listeners");
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json([
      {
        id: "lis-01",
        userId: "usr-demo-listener-01",
        name: "Aarav Sharma",
        eligibilityState: "eligible",
        applicationState: "approved",
        capacityLimit: 3,
        openChats: 1,
        weeklyHours: "14 hrs",
        empathyScore: 4.9,
        languages: ["English", "Hindi"],
        safeguardingExpiry: "Nov 2027",
      },
      {
        id: "lis-02",
        userId: "usr-demo-listener-02",
        name: "Priya Nair",
        eligibilityState: "eligible",
        applicationState: "approved",
        capacityLimit: 2,
        openChats: 2,
        weeklyHours: "18 hrs",
        empathyScore: 5.0,
        languages: ["English", "Malayalam"],
        safeguardingExpiry: "Jan 2028",
      },
      {
        id: "lis-03",
        userId: "usr-demo-listener-03",
        name: "Kabir Das",
        eligibilityState: "review_due",
        applicationState: "approved",
        capacityLimit: 1,
        openChats: 0,
        weeklyHours: "8 hrs",
        empathyScore: 4.8,
        languages: ["Hindi", "Bengali"],
        safeguardingExpiry: "Nov 2026",
      },
      {
        id: "lis-04",
        userId: "usr-demo-listener-04",
        name: "Meera Rao",
        eligibilityState: "suspended",
        applicationState: "pending",
        capacityLimit: 1,
        openChats: 0,
        weeklyHours: "4 hrs",
        empathyScore: 4.5,
        languages: ["English", "Kannada"],
        safeguardingExpiry: "Expired",
      },
    ]);
  }
}

