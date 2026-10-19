import { AuthFrame } from "@/components/auth/auth-frame";
import { SetupForm } from "@/components/auth/setup-form";

export default function AccountSetupPage() {
  return (
    <AuthFrame>
      <div className="w-full max-w-[576px]">
        <SetupForm />
      </div>
    </AuthFrame>
  );
}
