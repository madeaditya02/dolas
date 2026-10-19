import { NextResponse, type NextRequest } from "next/server";
import { getAuthCookieName } from "./app/actions/session";
// import { AUTH_COOKIE_NAME } from "@/app/actions/session";

const protectedPrefixes = ["/dashboard", "/auth/setup"];
const protectedSetupPrefixes = ["/dashboard"];

/** Fast optimistic gate only. Server routes must validate the token through /auth/me. */
export async function proxy(request: NextRequest) {
  const AUTH_COOKIE_NAME = await getAuthCookieName();
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected || request.cookies.has(AUTH_COOKIE_NAME)) {
    // ambil cookie, decode jwt, itu berupa objek berisi currency dan balance, jika currency atau balance null, redirect ke /auth/setup
    // const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    // if (cookie) {
    //   const decoded = jwt.verify(cookie, JWT_SECRET);
    //   if (decoded.currency === null || decoded.balance === null) {
    //     return NextResponse.redirect(new URL("/auth/setup", request.url));
    //   }
    // }
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/setup/:path*"],
};
