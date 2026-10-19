import axios from "axios";
import type { ApiError } from "./types";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;
  const data = error.response?.data;
  if (data?.message) return data.message;
  const firstFieldError = Object.values(data?.errors ?? {}).flat()[0];
  return firstFieldError ?? fallback;
}
