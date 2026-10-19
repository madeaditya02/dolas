import { AuthCard, AuthFrame, AuthIntro } from "@/components/auth/auth-frame";
import { RegisterForm } from "@/components/auth/register-form";
import { redirectAuthenticatedUser } from "@/app/actions/session";

export default async function RegisterPage() {
  await redirectAuthenticatedUser("/auth/register");

  return (
    <AuthFrame>
      <AuthCard className="max-w-[500px] p-6 pt-12 sm:p-8 sm:pt-12">
        <AuthIntro
          title="Create your Dolas account"
          description={<>Start tracking expenses naturally and get instant AI<br className="hidden sm:block" /> financial clarity.</>}
        />
        <RegisterForm />
      </AuthCard>
    </AuthFrame>
  );
}
