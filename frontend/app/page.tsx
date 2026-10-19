import type { Metadata } from "next";
import { requireAuthState } from "@/app/actions/session";
import { GuestLanding } from "@/components/home/guest-landing";
import { RecordTransaction } from "@/components/home/record-transaction";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";

export const metadata: Metadata = {
  title: "Dolas Finance",
  description: "Track your money and understand your spending with Gemini AI.",
};

function firstName(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).join(" ") || name;
}

export default async function HomePage() {
  const auth = await requireAuthState("/");
  const user = auth.state === "AUTHENTICATED" ? auth.user : null;

  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <SiteHeader userName={user?.name ?? null} />
      <main className="flex-1">
        {user ? (
          <section className="mx-auto flex w-full max-w-[1152px] flex-col gap-10 px-4 pb-12 pt-12 sm:px-8 lg:pt-10">
            <header className="flex flex-col gap-1">
              {/* <p className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold leading-[14px] tracking-[0.275px] text-on-surface-variant">
                <span className="size-2 rounded-full bg-secondary" />
                Gemini Engine Active • Instant Categorization
              </p> */}
              <h1 className="text-[32px] font-extrabold leading-10 tracking-[-0.8px] text-primary">
                Welcome back, {firstName(user.name)} 👋
              </h1>
              <p className="text-base leading-6 text-on-surface-variant">
                Quickly log today's spending or income with conversational AI intelligence.
              </p>
            </header>
            <RecordTransaction user={user} />
          </section>
        ) : (
          <GuestLanding />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
