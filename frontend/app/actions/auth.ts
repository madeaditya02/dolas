"use server"
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { ApiError, UserProfile } from "@/lib/api/types";
import { createSession, getAuthCookieName, getServerAuthState, readSessionToken } from "@/app/actions/session";
import { AuthState, classifyLoginError } from "@/lib/auth/state";
import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";

export interface LoginCredential {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredential {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export async function login(credential: LoginCredential) {
  try {
    const { data } = await apiClient.post<{ success: true; token: string; user: UserProfile; needsSetup: boolean }>('/auth/login', credential)
    const state: AuthState = data.needsSetup
      ? { state: "SETUP_REQUIRED", user: data.user }
      : { state: "AUTHENTICATED", user: data.user };
    await createSession(data.token, credential.rememberMe)
    return state
} catch (error) {
    console.log("Errrr")
    const emailState = classifyLoginError(error)
    if (emailState) {
      try {
        await apiClient.post('/auth/resend-verification', { email: credential.email })
      } catch {
        // Keep the email so the verification screen can show resend recovery after login fails.
      }
      return {
        state: "EMAIL_NOT_VERIFIED",
      };
    } else {
      // console.log("Error dari login", error.response?.data)
      // if (error instanceof AxiosError) {
      //   if (error.response?.data.error == 'need-setup') {
      //     return {
      //       state: "SETUP_REQUIRED",
      //     };
      //   }
      // }
      // throw error;
      if (axios.isAxiosError<ApiError>(error)) {
        const data = error.response?.data;
        if (data?.error === "email-not-verified") {
          return { state: "EMAIL_NOT_VERIFIED" as const };
        }
        return {
          state: "ERROR" as const,
          message: data?.message ?? "Email atau password salah",
          errors: data?.errors,
        };
      }
      return { state: "ERROR" as const, message: "Terjadi kesalahan pada pemrosesan data" };
    }
  }
}

export async function register(credential: RegisterCredential) {
  try {
    const { data } = await apiClient.post<{ success: true; message: string;}>('/auth/register', credential)
    return data.success
  } catch (error) {
    
  }
}

export async function getToken() {
  try {
    return (await cookies()).get(await getAuthCookieName())?.value
  } catch (error) {
    return null
  }
}

export async function getAuthenticatedUser() {
  try {
    const authState = await getServerAuthState()
    if (authState.state === "AUTHENTICATED") {
      return authState.user
    }
    return null
  } catch (error) {
    return null
  }
}

export async function setToken(token: string) {
  await createSession(token)
}

export interface SettingsActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

async function authorizedHeaders(): Promise<Record<string, string> | null> {
  const token = await readSessionToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function actionError(error: unknown, fallback: string): SettingsActionResult {
  if (axios.isAxiosError<ApiError>(error)) {
    return {
      success: false,
      message: getApiErrorMessage(error, fallback),
      errors: error.response?.data?.errors,
    };
  }
  return { success: false, message: fallback };
}

export async function updateProfile(payload: {
  name: string;
  currency: string;
  dailyLimit: number | string | null;
}): Promise<SettingsActionResult> {
  const headers = await authorizedHeaders();
  if (!headers) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  try {
    const { data } = await apiClient.post<{ success: true; message?: string }>("/auth/profile", payload, { headers });
    return { success: true, message: data.message || "Profil berhasil diubah" };
  } catch (error) {
    return actionError(error, "Profil tidak dapat diperbarui.");
  }
}

export async function updatePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<SettingsActionResult> {
  const headers = await authorizedHeaders();
  if (!headers) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  try {
    const { data } = await apiClient.post<{ success: true; message?: string }>("/auth/password", payload, { headers });
    return { success: true, message: data.message || "Password berhasil diubah" };
  } catch (error) {
    return actionError(error, "Password tidak dapat diperbarui.");
  }
}