import axios from "axios";
import type { ApiError, UserProfile } from "@/lib/api/types";

export type AuthState =
  | { state: "NOT_AUTHENTICATED" }
  | { state: "EMAIL_NOT_VERIFIED"; email?: string }
  | { state: "SETUP_REQUIRED"; user: UserProfile }
  | { state: "AUTHENTICATED"; user: UserProfile };

/** Classifies only states supported by the backend response contract. */
export function classifyUser(user: UserProfile): AuthState {
  if (user.currency === null || user.balance === null) {
    return { state: "SETUP_REQUIRED", user };
  }
  return { state: "AUTHENTICATED", user };
}

/** Email verification failure is a flow state, never an authenticated session. */
export function classifyLoginError(error: unknown, email?: string): AuthState | null {
  if (!axios.isAxiosError<ApiError>(error)) return null;
  if (error.response?.data?.error !== "email-not-verified") return null;
  return { state: "EMAIL_NOT_VERIFIED", email };
}

// export function authSessionResponse(authState: AuthState): AuthSessionResponse {
//   if (authState.state === "AUTHENTICATED" || authState.state === "SETUP_REQUIRED") {
//     return { state: authState.state, user: authState.user };
//   }
//   return { state: authState.state };
// }

/** Redirect rules shared by public and protected server routes. */
export function getAuthRedirect(authState: AuthState, requestedPath: string): string | null {
  const safeNext = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";

  // Verification links perform a one-time action and must remain reachable.
  if (requestedPath === "/auth/verify-email") return null;

  if (authState.state === "EMAIL_NOT_VERIFIED") {
    return requestedPath === "/auth/email-verification" ? null : "/auth/email-verification";
  }

  if (authState.state === "NOT_AUTHENTICATED") {
    if (requestedPath === "/auth/setup" || requestedPath.startsWith("/dashboard")) {
      return `/auth?next=${encodeURIComponent(safeNext)}`;
    }
    return null;
  }

  if (authState.state === "SETUP_REQUIRED") {
    return requestedPath === "/auth/setup" ? null : "/auth/setup";
  }

  if (requestedPath === "/auth/setup" || requestedPath === "/auth" || requestedPath.startsWith("/auth/")) {
    return "/";
  }
  return null;
}

/** Destination after a login or verification action completes. */
// export function getPostAuthDestination(authState: AuthState, next?: string): string {
//   if (authState.state === "EMAIL_NOT_VERIFIED") return "/auth/email-verification";
//   if (authState.state === "SETUP_REQUIRED") return "/auth/setup";
//   if (authState.state === "AUTHENTICATED") {
//     const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
//     return safeNext ?? "/dashboard";
//   }
//   return "/auth";
// }
