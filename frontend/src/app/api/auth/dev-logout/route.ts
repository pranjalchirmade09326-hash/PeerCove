import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("peercove_session");
  cookieStore.delete("dev_token");
  cookieStore.delete("activeRoleRedirectUrl");
  cookieStore.delete("better-auth.session_token");
  cookieStore.delete("better-auth.session_data");

  const response = NextResponse.json({ success: true });
  response.cookies.set("peercove_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("dev_token", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("activeRoleRedirectUrl", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("better-auth.session_token", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("better-auth.session_data", "", { path: "/", maxAge: 0, expires: new Date(0) });

  return response;
}
