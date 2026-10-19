import { getAuthCookieName } from "@/app/actions/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const AUTH_COOKIE_NAME = await getAuthCookieName();
  const response = NextResponse.redirect(new URL('/auth', request.url));
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}