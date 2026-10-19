"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiLoader, FiSearch, FiX } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { useForm } from "@/lib/form";

export interface TransactionQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  categories?: string;
  page?: string;
  limit?: string;
}

function writeQuery(current: TransactionQuery, patch: Partial<Record<keyof TransactionQuery, string | null>>) {
  const next = new URLSearchParams();
  const merged: TransactionQuery = { ...current, ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value)) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === '') delete merged[key as keyof TransactionQuery];
  }
  for (const [key, value] of Object.entries(merged)) {
    if (value) next.set(key, value);
  }
  const query = next.toString();
  return query ? `/dashboard/transactions?${query}` : "/dashboard/transactions";
}

export function TransactionControls({
  query,
  categories,
  total,
}: {
  query: TransactionQuery;
  categories: string[];
  total: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query.search ?? "");
  const [busy, setBusy] = useState(false);

  const { values, handleChange } = useForm({
    search: query.search ?? "",
    startDate: query.startDate ?? "",
    endDate: query.endDate ?? "",
    type: query.type ?? "",
    categories: query.categories ?? "",
  });

  // useEffect(() => {
  //   if (search === (query.search ?? "")) return;
  //   const timer = window.setTimeout(() => {
  //     router.replace(writeQuery(query, { search: search.trim() || null, page: null }));
  //   }, 400);
  //   return () => window.clearTimeout(timer);
  // }, [search, query, router]);

  useEffect(() => {
    setBusy(false);
  }, [query, router]);

  function update(patch: Partial<Record<keyof TransactionQuery, string | null>>) {
    setBusy(true);
    router.replace(writeQuery(query, { ...patch, page: null }));
  }

  const filtered = Boolean(query.search || query.startDate || query.endDate || query.type || query.categories);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-surface px-3 py-2">
          <FiSearch aria-hidden className="size-4 shrink-0 text-on-surface-variant" />
          <input
            name="search"
            value={values.search}
            onChange={handleChange}
            // onChange={(event) => setSearch(event.target.value)}
            placeholder="Search transactions by merchant, note, or amount..."
            className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
          />
        </label>
        <label className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[13px] text-on-surface">
          <FiCalendar aria-hidden className="size-4 text-secondary" />
          <input
            name="startDate"
            type="date"
            aria-label="Start date"
            value={values.startDate}
            // onChange={(event) => update({ startDate: event.target.value || null })}
            onChange={handleChange}
            className="bg-transparent outline-none"
          />
          <span aria-hidden className="text-on-surface-variant">–</span>
          <input
            type="date"
            name="endDate"
            aria-label="End date"
            value={values.endDate}
            onChange={handleChange}
            // value={query.endDate ?? ""}
            // onChange={(event) => update({ endDate: event.target.value || null })}
            className="bg-transparent outline-none"
          />
        </label>
        <select
          aria-label="Transaction type"
          name="type"
          value={values.type}
          onChange={handleChange}
          // value={query.type ?? ""}
          // onChange={(event) => update({ type: event.target.value || null })}
          className="rounded-lg bg-surface px-3 py-2 text-[13px] text-on-surface outline-none"
        >
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <select
          aria-label="Category"
          name="categories"
          value={values.categories}
          onChange={handleChange}
          // value={query.categories ?? ""}
          // onChange={(event) => update({ categories: event.target.value || null })}
          className="rounded-lg bg-surface px-3 py-2 text-[13px] text-on-surface outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between gap-3">
        {/* <p className="inline-flex items-center gap-2 text-[13px] text-on-surface-variant">
          <span className="size-2 rounded-full bg-secondary" />
          Showing {total} of {total} transactions
        </p> */}
        <button type="button" onClick={() => update(values)} className="inline-flex items-center gap-1 self-start rounded-lg bg-primary-container px-4 py-2.5 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={busy}>
        {busy ? <FiLoader className="size-4 animate-spin" /> : <CiFilter aria-hidden className="size-4" />}
          Apply Filters
        </button>
        {filtered && (
          <button type="button" className="inline-flex items-center gap-1 text-[13px] font-semibold text-secondary" onClick={() => update({ search: null, startDate: null, endDate: null, type: null, categories: null })}>
            <FiX aria-hidden className="size-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

export function RowsPerPage({ query }: { query: TransactionQuery }) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-on-surface-variant">
      Rows per page:
      <select
        aria-label="Rows per page"
        value={query.limit ?? "10"}
        onChange={(event) => router.replace(writeQuery(query, { limit: event.target.value, page: null }))}
        className="rounded-lg bg-surface-container-lowest px-2 py-1 text-on-surface outline-none"
      >
        {["10", "25", "50", "100"].map((size) => (
          <option key={size} value={size}>{size} per page</option>
        ))}
      </select>
    </label>
  );
}
