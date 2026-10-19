import { AuthCard, AuthFrame, AuthIntro } from "@/components/auth/auth-frame";
import { LoginForm } from "@/components/auth/login-form";
import { redirectAuthenticatedUser } from "@/app/actions/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await redirectAuthenticatedUser("/auth");
  const { next } = await searchParams;

  return (
    <AuthFrame>
      <AuthCard className="max-w-125 p-6 pt-12 sm:p-8 sm:pt-12">
        <AuthIntro
          title="Log in to your Dolas account"
          description="Sign in to your account and start maintain your finance"
        />
        <LoginForm next={next} />
      </AuthCard>
    </AuthFrame>
  );
}
