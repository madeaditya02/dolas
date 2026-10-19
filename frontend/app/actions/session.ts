"use server"
// import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/lib/api/types";
import { classifyUser, getAuthRedirect, type AuthState } from "../../lib/auth/state";
import { apiClient } from "@/lib/api/client";
// import { AUTH_COOKIE_NAME } from "../../lib/auth/constants";

// export { AUTH_COOKIE_NAME } from "../../lib/auth/constants";
// export const AUTH_COOKIE_NAME = "finance_session";

export interface UserResponse {
  success: true;
  user: UserProfile;
}

const AUTH_COOKIE_NAME = "finance_session";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const SESSION_REMEMBERED_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export async function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export async function sessionCookieOptions(rememberMe = true) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(rememberMe ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
  };
}

export async function createSession(token: string, remembered: boolean = false) {
  const expiresAt = new Date(Date.now() + (remembered ? 30 : 7) * 24 * 60 * 60 * 1000)
  const cookieStore = await cookies()

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function readSessionToken(): Promise<string | null> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
}

export const getServerAuthState = cache(async (): Promise<AuthState> => {
  const accessToken = await readSessionToken();
  if (!accessToken) return { state: "NOT_AUTHENTICATED" };

  try {
    // const response = await backendAuthApi.me(accessToken);
    const response = await apiClient.get<UserResponse>("/auth/me", { headers: { Authorization: `Bearer ${accessToken}` } })
    const user: UserProfile = response.data.user;
    return classifyUser(user);
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 401) {
      return { state: "NOT_AUTHENTICATED" };
    }
    // A backend outage must not be misreported as a signed-out user.
    throw error;
  }
});

export async function requireAuthState(pathname: string): Promise<AuthState> {
  const authState = await getServerAuthState();
  const destination = getAuthRedirect(authState, pathname);
  if (destination) redirect(destination);
  return authState;
}

export async function redirectAuthenticatedUser(pathname: string): Promise<void> {
  const authState = await getServerAuthState();
  const destination = getAuthRedirect(authState, pathname);
  if (destination) redirect(destination);
}

export async function flashSession(key: string, message: string) {
  (await cookies()).set(`flash_${key}`, message, {
    path: '/',
    maxAge: 10,
  });
}

export async function getFlashSession(key: string) {
  return (await cookies()).get(`flash_${key}`)?.value ?? null;
}