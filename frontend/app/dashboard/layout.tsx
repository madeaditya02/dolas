import type { ReactNode } from "react";
import { getServerAuthState, requireAuthState } from "@/app/actions/session";
import { DashboardShell } from "@/components/dashboard/shell";
import { FlashToast } from "@/components/toast";

export default async function ProtectedDashboardLayout({ children }: { children: ReactNode }) {
  await requireAuthState("/dashboard");
  const auth = await getServerAuthState();
  const userName = auth.state === "AUTHENTICATED" ? auth.user.name : "";

  return <><DashboardShell userName={userName}>{children}</DashboardShell>
  <FlashToast />
  </>;
}
