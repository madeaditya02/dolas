import { EmailVerificationCard } from "@/components/auth/email-verification-card";
import { redirectAuthenticatedUser } from "@/app/actions/session";

export default async function EmailVerificationPage() {
  await redirectAuthenticatedUser("/auth/email-verification");
  return <EmailVerificationCard />;
}
