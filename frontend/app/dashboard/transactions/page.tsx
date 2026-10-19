import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { FiArrowDown, FiArrowUp, FiHome, FiPlus, FiTrendingUp } from "react-icons/fi";
import { getServerAuthState, readSessionToken } from "@/app/actions/session";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { TransactionType } from "@/lib/api/types";
import { formatMoney } from "@/components/dashboard/format";
import { RowsPerPage, TransactionControls, type TransactionQuery } from "@/components/dashboard/transaction-controls";
import { TransactionMenu } from "@/components/dashboard/transaction-menu";

export const metadata: Metadata = {
  title: "Transactions · Dolas Finance",
};

interface TransactionRow {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
}

interface TransactionListResponse {
  success: true;
  data: TransactionRow[];
  meta: { currentPage: number; limit: number; totalItems: number; totalPages: number };
  summary: { income: number; expense: number; net: number };
  categories?: string[];
}

function pageHref(query: TransactionQuery, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/dashboard/transactions?${text}` : "/dashboard/transactions";
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function signedAmount(type: TransactionType, amount: number, currency: string | null) {
  const formatted = formatMoney(Math.abs(amount), currency);
  if (type === "EXPENSE") return `-${formatted}`;
  if (type === "INCOME") return `+${formatted}`;
  return formatted;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionQuery>;
}) {
  const query = await searchParams;
  const auth = await getServerAuthState();
  const currency = auth.state === "AUTHENTICATED" ? auth.user.currency : "IDR";
  const token = await readSessionToken();
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  let result: TransactionListResponse | null = null;
  let error = "";
  try {
    const response = await apiClient.get<TransactionListResponse>("/transactions", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page,
        limit,
        search: query.search || undefined,
        startDate: query.startDate || undefined,
        endDate: query.endDate ? `${query.endDate}T23:59:59.999` : undefined,
        type: query.type || undefined,
        categories: query.categories || undefined,
      },
    });
    result = response.data;
  } catch (requestError) {
    error = getApiErrorMessage(requestError, "Daftar transaksi tidak dapat dimuat.");
  }

  const totalItems = result?.meta.totalItems ?? 0;
  const from = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);
  const totalPages = result?.meta.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold leading-[14px] tracking-[0.55px] text-secondary">LEDGER OVERVIEW</p>
          <h1 className="text-[32px] font-bold leading-10 tracking-[-0.8px] text-on-surface">Transactions</h1>
          <p className="text-sm leading-5 text-on-surface-variant">
            View, filter, and manage your complete financial history with intelligent categorization.
          </p>
        </div>
        <Link href="/" className="inline-flex items-center gap-1 self-start rounded-lg bg-primary-container px-4 py-2.5 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary">
          <FiPlus aria-hidden className="size-4" />
          New Transaction
        </Link>
      </div>

      {error && <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}

      {result && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Period Volume" value={formatMoney(result.summary.income + result.summary.expense, currency)} tone="neutral" icon={<FiHome aria-hidden className="size-4" />} />
            <SummaryCard label="Total Inflows" value={`+${formatMoney(result.summary.income, currency)}`} tone="in" icon={<FiArrowDown aria-hidden className="size-4" />} />
            <SummaryCard label="Total Outflows" value={`-${formatMoney(result.summary.expense, currency)}`} tone="out" icon={<FiArrowUp aria-hidden className="size-4" />} />
            <SummaryCard label="Net Delta" value={`${result.summary.net >= 0 ? "+" : "-"}${formatMoney(Math.abs(result.summary.net), currency)}`} tone="in" icon={<FiTrendingUp aria-hidden className="size-4" />} />
          </section>

          <TransactionControls key={query.search ?? ""} query={query} categories={result.categories ?? []} total={totalItems} />

          <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-surface-container-low text-[11px] font-bold tracking-[0.44px] text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 font-bold">DATE</th>
                    <th className="px-4 py-3 font-bold">DESCRIPTION</th>
                    <th className="px-4 py-3 font-bold">CATEGORY</th>
                    <th className="px-4 py-3 font-bold">TYPE</th>
                    <th className="px-4 py-3 text-right font-bold">AMOUNT</th>
                    <th className="px-4 py-3 text-right font-bold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-on-surface-variant">No transactions match these filters.</td>
                    </tr>
                  )}
                  {result.data.map((row) => (
                    <tr key={row.id} className="border-t border-surface-container">
                      <td className="px-4 py-3 text-[13px] text-on-surface-variant">{formatDay(row.date)}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-on-surface">{row.description}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-surface-container px-2.5 py-1 text-[12px] text-on-surface-variant">{row.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <TypePill type={row.type} />
                      </td>
                      <td className={`px-4 py-3 text-right text-[13px] font-semibold ${row.type === "EXPENSE" ? "text-error" : "text-secondary"}`}>
                        {signedAmount(row.type, row.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TransactionMenu transactionId={row.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-surface-container bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-on-surface-variant">
                Filtered Total:{" "}
                <span className="font-semibold text-secondary">Income {signedAmount("INCOME", result.summary.income, currency)}</span>
                {" · "}
                <span className="font-semibold text-error">Expenses {signedAmount("EXPENSE", result.summary.expense, currency)}</span>
                {" · "}
                <span className="font-semibold text-secondary">Net {result.summary.net >= 0 ? "+" : "-"}{formatMoney(Math.abs(result.summary.net), currency)}</span>
              </p>
              <RowsPerPage query={query} />
            </div>
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-on-surface-variant">Showing {from} to {to} of {totalItems} transactions</p>
              <nav className="flex items-center gap-1 text-[13px] font-semibold">
                <PagerLink href={page > 1 ? pageHref(query, page - 1) : null}>Previous</PagerLink>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1)
                  .map((number) => (
                    <Link
                      key={number}
                      href={pageHref(query, number)}
                      className={`inline-flex size-8 items-center justify-center rounded-lg ${number === page ? "bg-primary-container text-on-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`}
                    >
                      {number}
                    </Link>
                  ))}
                <PagerLink href={page < totalPages ? pageHref(query, page + 1) : null}>Next</PagerLink>
              </nav>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "neutral" | "in" | "out";
  icon: ReactNode;
}) {
  const labelClass = tone === "in" ? "text-secondary" : tone === "out" ? "text-error" : "text-on-surface-variant";
  const valueClass = tone === "in" ? "text-secondary" : tone === "out" ? "text-error" : "text-on-surface";
  const iconClass = tone === "in" ? "bg-secondary-container/30 text-secondary" : tone === "out" ? "bg-error-container text-error" : "bg-surface-container text-secondary";
  return (
    <article className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div>
        <p className={`text-[11px] font-bold leading-[14px] tracking-[0.55px] uppercase ${labelClass}`}>{label}</p>
        <p className={`mt-0.5 text-[22px] font-semibold leading-[26px] tracking-[-0.22px] ${valueClass}`}>{value}</p>
      </div>
      <span className={`flex size-10 items-center justify-center rounded-full ${iconClass}`}>{icon}</span>
    </article>
  );
}

function TypePill({ type }: { type: TransactionType }) {
  if (type === "INCOME") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container/40 px-2 py-1 text-[12px] font-semibold text-secondary"><FiArrowUp aria-hidden className="size-3" /> Income</span>;
  }
  if (type === "EXPENSE") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-1 text-[12px] font-semibold text-error"><FiArrowDown aria-hidden className="size-3" /> Expense</span>;
  }
  return <span className="inline-flex rounded-full bg-tertiary-fixed px-2 py-1 text-[12px] font-semibold text-on-tertiary-fixed-variant">Transfer</span>;
}

function PagerLink({ href, children }: { href: string | null; children: string }) {
  if (!href) return <span className="px-2 text-outline">{children}</span>;
  return <Link href={href} className="px-2 text-on-surface-variant hover:text-on-surface">{children}</Link>;
}
