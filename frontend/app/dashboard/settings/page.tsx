import type { Metadata } from "next";
import { getServerAuthState, readSessionToken } from "@/app/actions/session";
import { apiClient } from "@/lib/api/client";
import { SettingsForms } from "@/components/dashboard/settings-forms";

export const metadata: Metadata = {
  title: "Settings · Dolas Finance",
};

export default async function SettingsPage() {
  const auth = await getServerAuthState();
  const user = auth.state === "AUTHENTICATED" ? auth.user : null;
  const token = await readSessionToken();
  let dailyLimit: number | null = null;

  if (token) {
    try {
      const response = await apiClient.get<{ success: true; data: { safeToSpend: { dailyLimit: number } | null } }>(
        "/dashboard",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      dailyLimit = response.data.data.safeToSpend?.dailyLimit ?? null;
    } catch {
      dailyLimit = null;
    }
  }

  return (
    <SettingsForms
      name={user?.name ?? ""}
      email={user?.email ?? ""}
      currency={user?.currency ?? "id-ID IDR"}
      dailyLimit={dailyLimit}
    />
  );
}
