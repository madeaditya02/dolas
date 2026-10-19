import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FiArrowDown, FiArrowUp, FiCreditCard, FiHome, FiShield, FiTrendingDown } from "react-icons/fi";
import { getServerAuthState, readSessionToken } from "@/app/actions/session";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { HotspotChart, IncomeExpenseChart } from "@/components/dashboard/charts";
import { DailyLimitSetup } from "@/components/dashboard/daily-limit-dialog";
import { currentMonthValue, formatMoney, hotspotColors, isMonthValue, monthLabel } from "@/components/dashboard/format";
import { MonthFilter } from "@/components/dashboard/month-filter";

export const metadata: Metadata = {
  title: "Overview · Dolas Finance",
};

interface Metric {
  amount: number | null;
  percentageChange: number;
}

interface DashboardData {
  overview: {
    currentBalance: Metric;
    expensesThisMonth: Metric;
    incomeThisMonth: Metric;
  };
  safeToSpend: null | {
    dailyLimit: number;
    spentToday: number;
    left: number;
    percentageUsed: number;
  };
  spendingHotspots: {
    totalExpenses: number;
    categories: { category: string; amount: number; percentage: number }[];
  };
  incomeVsExpense: {
    netSaved: number;
    weeklyData: { week: string; income: number; expense: number }[];
    avgInflowPerWeek: number;
    avgOutflowPerWeek: number;
    savingsRate: number;
  };
}

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? FiArrowUp : FiArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full ${positive ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-error-container text-on-error-container"} px-2 py-0.5 text-[11px] font-bold leading-[14px] tracking-[0.44px]`}>
      <Icon aria-hidden className="size-2.5" />
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: requestedMonth } = await searchParams;
  const month = isMonthValue(requestedMonth) ? requestedMonth : currentMonthValue();
  // previous month from month, e.g. month is "2026-09", then previous month is "2026-08"
  const previousMonth = new Date(month);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthString = previousMonth.toISOString().split('T')[0];
  const auth = await getServerAuthState();
  const currency = auth.state === "AUTHENTICATED" ? auth.user.currency : "IDR";
  const token = await readSessionToken();

  let data: DashboardData | null = null;
  let error = "";
  try {
    const response = await apiClient.get<{ success: true; data: DashboardData }>("/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
      params: { month },
    });
    console.log(response.data.data);
    data = response.data.data;
  } catch (requestError) {
    error = getApiErrorMessage(requestError, "Data dasbor tidak dapat dimuat.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-10 tracking-[-0.8px] text-on-surface">Overview</h1>
          <p className="text-sm leading-5 text-on-surface-variant">Here&apos;s how your finances are doing this month.</p>
        </div>
        <MonthFilter month={month} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>
      )}

      {data && (
        <>
          <section className="grid gap-6 md:grid-cols-3">
            <MetricCard
              label="Current Balance"
              amount={formatMoney(data.overview.currentBalance.amount ?? 0, currency)}
              change={data.overview.currentBalance.percentageChange}
              icon={<FiHome aria-hidden className="size-4 text-secondary" />}
              iconClassName="bg-surface-container"
              glowClassName="bg-primary-fixed/20"
            />
            <MetricCard
              label={month === currentMonthValue() ? "Expenses This Month" : `Expenses in ${monthLabel(month, "long")}`}
              amount={formatMoney(data.overview.expensesThisMonth.amount ?? 0, currency)}
              change={data.overview.expensesThisMonth.percentageChange}
              icon={<FiTrendingDown aria-hidden className="size-4 text-error" />}
              iconClassName="bg-error-container"
              glowClassName="bg-error-container/40"
              month={month}
              previousMonth={previousMonthString}
            />
            <MetricCard
              // label="Income This Month"
              label={month === currentMonthValue() ? "Income This Month" : `Income in ${monthLabel(month, "long")}`}
              amount={formatMoney(data.overview.incomeThisMonth.amount ?? 0, currency)}
              change={data.overview.incomeThisMonth.percentageChange}
              icon={<FiCreditCard aria-hidden className="size-4 text-primary-container" />}
              iconClassName="bg-primary-fixed"
              glowClassName="bg-secondary-container/30"
              month={month}
              previousMonth={previousMonthString}
            />
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="inline-flex items-center gap-1 text-lg font-semibold leading-6 tracking-[-0.18px] text-on-surface">
                  <FiShield aria-hidden className="size-4 text-secondary" />
                  Safe to Spend Today
                </h2>
                <p className="text-[13px] leading-[18px] text-on-surface-variant">
                  {data.safeToSpend
                    ? "Calculated dynamically based on your monthly fixed bills and remaining disposable budget."
                    : "Start setup your daily limit of spending and track your spending so you don't go over your limit"}
                </p>
              </div>
              {!data.safeToSpend && <DailyLimitSetup />}
            </div>
            {data.safeToSpend && (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <p className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-primary">
                    {formatMoney(data.safeToSpend.left, currency)}{" "}
                    <span className="text-lg font-semibold tracking-[-0.18px] text-on-surface">left</span>
                  </p>
                  <p className="text-[13px] leading-[18px] text-on-surface-variant">
                    <span className="font-bold text-on-surface">{formatMoney(data.safeToSpend.spentToday, currency)}</span> spent today
                    <span className="px-2">•</span>
                    Daily limit: <span className="font-bold text-on-surface">{formatMoney(data.safeToSpend.dailyLimit, currency)}</span>
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                  <div className={`h-full rounded-full ${data.safeToSpend.percentageUsed >= 100 ? "bg-error" : "bg-secondary"}`} style={{ width: `${Math.min(data.safeToSpend.percentageUsed, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold leading-[14px] tracking-[0.44px] text-on-surface-variant">
                  {/* <span>{formatMoney(0, currency)} (Morning)</span> */}
                  <span>{data.safeToSpend.percentageUsed}% Used</span>
                  <span>{formatMoney(data.safeToSpend.dailyLimit, currency)} Cap</span>
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-12">
            <article className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] lg:col-span-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold leading-6 tracking-[-0.18px] text-on-surface">Spending Hotspots</h2>
                  <p className="text-[13px] leading-[18px] text-on-surface-variant">Expenses this month by category</p>
                </div>
                <span className="rounded bg-surface-container px-2 py-1 text-[11px] font-bold leading-[14px] tracking-[0.44px] text-on-surface-variant">
                  {monthLabel(month, "short")}
                </span>
              </div>
              <HotspotChart total={data.spendingHotspots.totalExpenses} currency={currency} categories={data.spendingHotspots.categories} />
              <ul className="flex flex-col">
                {data.spendingHotspots.categories.map((category, index) => (
                  <li key={category.category} className="flex items-center justify-between rounded px-1.5 py-1.5">
                    <span className="inline-flex items-center gap-1 text-[13px] leading-[18px] text-on-surface">
                      <span className="size-3 rounded-full" style={{ backgroundColor: hotspotColors[index % hotspotColors.length] }} />
                      {category.category}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[11px] font-bold tracking-[0.44px] text-on-surface-variant">{category.percentage}%</span>
                      <span className="w-16 text-right text-[13px] font-semibold tracking-[0.13px] text-on-surface">
                        {formatMoney(category.amount, currency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="flex flex-col justify-between gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] lg:col-span-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold leading-6 tracking-[-0.18px] text-on-surface">Income vs Expense</h2>
                  <p className="text-[13px] leading-[18px] text-on-surface-variant">Last 4 weeks</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.44px] text-on-surface-variant">
                    <span className="size-3 rounded-sm bg-secondary" /> Income
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.44px] text-on-surface-variant">
                    <span className="size-3 rounded-sm bg-outline-variant" /> Expense
                  </span>
                  <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-[11px] font-bold tracking-[0.44px] text-on-secondary-fixed-variant">
                    Net Saved: {data.incomeVsExpense.netSaved >= 0 ? "+" : ""}
                    {formatMoney(data.incomeVsExpense.netSaved, currency)}
                  </span>
                </div>
              </div>
              <IncomeExpenseChart weeks={data.incomeVsExpense.weeklyData} currency={currency} />
              <div className="grid gap-2 sm:grid-cols-3">
                <Stat label="Avg. Inflow" value={`${formatMoney(data.incomeVsExpense.avgInflowPerWeek, currency)} / wk`} />
                <Stat label="Avg. Outflow" value={`${formatMoney(data.incomeVsExpense.avgOutflowPerWeek, currency)} / wk`} />
                <Stat label="Savings Rate" value={`${data.incomeVsExpense.savingsRate}%`} accent />
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  amount,
  change,
  icon,
  iconClassName,
  glowClassName,
  month,
  previousMonth,
}: {
  label: string;
  amount: string;
  change: number;
  icon: ReactNode;
  iconClassName: string;
  glowClassName: string;
  month?: string;
  previousMonth?: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface-variant">{label}</p>
        <span className={`flex size-8 items-center justify-center rounded-full ${iconClassName}`}>{icon}</span>
      </div>
      <p className="mt-2 text-[32px] font-extrabold leading-10 tracking-[-0.8px] text-on-surface">{amount}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] leading-[18px] text-on-surface-variant">
        <ChangeBadge value={change} />
        {/* from last month */}
        {/* if month is current month, show "from last month" else show "from {previousMonth}" */}
        {month === undefined ||month === currentMonthValue() ? "from last month" : `from ${monthLabel(previousMonth!, "long")}`}
      </p>
      <span aria-hidden className={`absolute -right-4 -bottom-4 size-24 rounded-full ${glowClassName}`} />
    </article>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-2.5">
      <p className="text-[11px] font-bold leading-[14px] tracking-[0.44px] text-on-surface-variant">{label}</p>
      <p className={`text-[13px] font-bold leading-4 tracking-[0.13px] ${accent ? "text-secondary" : "text-on-surface"}`}>{value}</p>
    </div>
  );
}
