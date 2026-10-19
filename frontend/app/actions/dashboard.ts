"use server";

import { readSessionToken } from "@/app/actions/session";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";

export interface DashboardActionResult {
  success: boolean;
  message: string;
}

export async function setDailyLimit(dailyLimit: number): Promise<DashboardActionResult> {
  const token = await readSessionToken();
  if (!token) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  try {
    const { data } = await apiClient.post<{ success: true; message?: string }>(
      "/auth/daily-limit",
      { dailyLimit },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return { success: true, message: data.message || "Batas harian berhasil diubah." };
  } catch (error) {
    return { success: false, message: getApiErrorMessage(error, "Batas harian tidak dapat disimpan.") };
  }
}
