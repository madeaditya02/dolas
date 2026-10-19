import Link from "next/link";
import { FiArrowRight, FiCamera, FiCpu, FiMessageSquare, FiShield, FiTrendingUp, FiZap } from "react-icons/fi";

const features = [
  {
    title: "Text-Based Recording",
    body: "Describe any expense naturally like “Lunch with client, $42.50” without ever hunting through nested dropdown menus.",
    badge: "Zero Form Fields Required",
    icon: FiMessageSquare,
  },
  {
    title: "OCR Receipt Recognition",
    body: "Snap or upload wrinkled paper receipts; intelligent camera OCR extracts line items, sales tax, and merchants instantly.",
    badge: "Multi-currency & Global Tax",
    icon: FiCamera,
  },
  {
    title: "AI-Powered Parsing",
    body: "Built-in Gemini models automatically flag recurring subscriptions, sort tax deductions, and spot fee anomalies before statement closes.",
    badge: "Context-Aware Categorization",
    icon: FiCpu,
  },
  {
    title: "Financial Insights",
    body: "Real-time Safe-to-Spend limits, spending hotspot breakdowns, and 30-day cashflow trajectories that keep peace of mind intact.",
    badge: "Predictive Burn Rate Radar",
    icon: FiTrendingUp,
  },
];

export function GuestLanding() {
  return (
    <>
      <section className="mx-auto flex w-full max-w-[896px] flex-col items-center px-4 py-12 text-center sm:px-8">
        <p className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-4 py-1.5 text-[11px] font-semibold leading-[14px] tracking-[0.55px] text-secondary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <FiZap aria-hidden className="size-[15px]" />
          POWERED BY GEMINI AI
        </p>
        <h1 className="mt-4 text-[40px] font-extrabold leading-[1.15] tracking-[-1.2px] text-on-surface sm:text-5xl sm:leading-[56px]">
          Track your money.
          <span className="block text-primary-container">Understand your spending.</span>
        </h1>
        <p className="mt-4 max-w-[672px] text-base leading-6 text-on-surface-variant">
          Record income and expenses effortlessly by simply typing what happened in plain English or
          snapping a receipt. Our Gemini AI extracts merchants, categories, and totals in seconds
          with zero manual data entry.
        </p>
        <Link
          href="/auth/register"
          className="mt-8 inline-flex items-center gap-1 rounded-lg bg-primary-container px-6 py-3.5 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary"
        >
          Get Started Free
          <FiArrowRight aria-hidden className="size-3" />
        </Link>
        <p className="mt-6 inline-flex items-center gap-1 text-[11px] font-bold leading-[14px] tracking-[0.44px] text-on-surface-variant">
          <FiShield aria-hidden className="size-[13px]" />
          No credit card required
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-[1216px] flex-col items-center gap-12 px-4 py-4 pb-16 sm:px-8">
        <div className="flex max-w-[672px] flex-col items-center gap-1.5 text-center">
          <p className="text-[11px] font-semibold leading-[14px] tracking-[0.55px] text-secondary">
            EFFORTLESS AUTOPILOT
          </p>
          <h2 className="text-[28px] font-bold leading-9 tracking-[-0.64px] text-on-surface sm:text-[32px] sm:leading-10">
            Designed for clarity, built for speed
          </h2>
          <p className="text-sm leading-5 text-on-surface-variant">
            Say goodbye to spreadsheet dread and manual category sorting. Experience the modern way to keep
            tabs on cashflow.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="flex h-full flex-col justify-between rounded-2xl bg-surface-container-lowest p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-surface-container text-secondary">
                    <Icon aria-hidden className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-6 tracking-[-0.18px] text-on-surface">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[18px] text-on-surface-variant">{feature.body}</p>
                </div>
                <p className="mt-6 rounded-lg bg-surface-container-low px-2 py-3 text-center text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-secondary">
                  {feature.badge}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
