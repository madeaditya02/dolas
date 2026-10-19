import { getAuthCookieName, sessionCookieOptions } from "@/app/actions/session";
import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export interface VerifyEmailResponse {
  success: true;
  message: string;
  accessToken: string;
}

export async function GET(request: NextRequest) {
  // const data = await res.json()
  const AUTH_COOKIE_NAME = await getAuthCookieName();
  const token = request.nextUrl.searchParams.get('token');
  try {
    if (token) {
      // const { data } = await backendAuthApi.verifyEmail(token);
      const { data } = await apiClient.post<VerifyEmailResponse>("/auth/verify-email", { token })
      const response = NextResponse.redirect(new URL('/auth/setup', request.url));
      response.cookies.set(AUTH_COOKIE_NAME, data.accessToken, await sessionCookieOptions(false));
      return response;
    }
    throw Error()
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(new URL('/auth', request.url));
  }
}