import type { ReactNode } from "react";
import { requireAuthState } from "@/app/actions/session";

export default async function AccountSetupLayout({ children }: { children: ReactNode }) {
  await requireAuthState("/auth/setup");
  return children;
}
