"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowDown, FiArrowUp, FiCalendar, FiCheck, FiRepeat, FiTag } from "react-icons/fi";
import { updateTransaction, type EditableTransaction } from "@/app/actions/transactions";
import { useForm } from "@/lib/form";
import { useToast } from "@/components/toast";
import type { TransactionType } from "@/lib/api/types";
import { NumericFormat } from "react-number-format";
import { useState } from "react";
import { flashSession } from "@/app/actions/session";

const types: { value: TransactionType; label: string; icon: typeof FiArrowDown }[] = [
  { value: "EXPENSE", label: "Expense", icon: FiArrowDown },
  { value: "INCOME", label: "Income", icon: FiArrowUp },
  // { value: "TRANSFER", label: "Transfer", icon: FiRepeat },
];

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function currencySymbol(currency: string | null) {
  const raw = currency?.trim() || "IDR";
  const [maybeLocale, maybeCode] = raw.split(" ");
  const code = maybeCode || raw;
  const locale = maybeCode ? maybeLocale : code === "IDR" ? "id-ID" : "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function EditTransactionForm({
  transaction,
  categories,
  currency,
}: {
  transaction: EditableTransaction;
  categories: string[];
  currency: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState(new Intl.NumberFormat(currency?.split(" ")[0], { style: "currency", currency: currency?.split(" ")[1] }).format(transaction.amount));
  const { values, errors, isPending, handleChange, changeValue, setError, handleSubmit } = useForm({
    type: transaction.type,
    description: transaction.description,
    category: transaction.category,
    amount: String(transaction.amount),
    date: toDateTimeLocal(transaction.date),
  });

  // const categoryOptions = Array.from(new Set([transaction.category, ...categories].filter(Boolean)));
  const categoryExpenseOptions = Array.from(new Set(["Makan & Minum", "Transportasi", "Tagihan", "Kesehatan", "Hiburan", "Lainnya"]));
  const categoryIncomeOptions = Array.from(new Set(["Gaji", "Transfer & Top Up"]));
  // const categoryOptions = transaction.type == "EXPENSE" ? categoryExpenseOptions : categoryIncomeOptions;
  const symbol = currencySymbol(currency);

  const submit = handleSubmit(async (form) => {
    const amountText = form.amount.trim();
    // convert formatted number to raw number
    // const amount = new Intl.NumberFormat(currency?.split(" ")[0], { style: "currency", currency: currency?.split(" ")[1] }).parse(amountText);
    const amount = amountText !== "" && Number.isFinite(Number(amountText)) ? Number(amountText) : amountText;
    const parsedDate = new Date(form.date);
    const date = Number.isNaN(parsedDate.getTime()) ? form.date : parsedDate.toISOString();

    const result = await updateTransaction(transaction.id, {
      amount,
      description: form.description,
      category: form.category,
      date,
      type: form.type,
    });

    if (!result.success) {
      if (result.errors) {
        for (const [field, messages] of Object.entries(result.errors)) {
          if (messages?.length) setError(field, messages);
        }
      }
      if (!result.errors || Object.keys(result.errors).length === 0) toast.error(result.message);
      return;
    }

    // toast.success(result.message);
    await flashSession('toast', JSON.stringify({ status: 'success', message: result.message }));
    router.push("/dashboard/transactions");
  });

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl rounded-xl bg-surface-container-lowest p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:p-12">
      <header className="border-b border-surface-container pb-6">
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.8px] text-on-surface">Edit Transaction</h1>
        <p className="mt-1 text-sm leading-5 text-on-surface-variant">Update transaction parameters for this ledger record.</p>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        <fieldset className="flex flex-col gap-1">
          <legend className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface">Transaction Type</legend>
          <div className="mt-1 grid grid-cols-1 gap-2 rounded-xl bg-surface-container-low p-1.5 sm:grid-cols-2">
            {types.map((item) => {
              const selected = values.type === item.value;
              const Icon = item.icon;
              const selectedClass = item.value === "EXPENSE"
                ? "bg-surface-container-lowest text-error shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                : item.value === "INCOME"
                  ? "bg-surface-container-lowest text-secondary shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                  : "bg-surface-container-lowest text-tertiary shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-[13px] font-bold tracking-[0.13px] ${selected ? selectedClass : "text-on-surface-variant"}`}
                  onClick={() => {changeValue("type", item.value); changeValue('category', '')}}
                >
                  <Icon aria-hidden className="size-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {errors?.type?.[0] && <p className="text-sm text-error">{errors.type[0]}</p>}
        </fieldset>

        <label className="flex flex-col gap-1 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          Description / Merchant Name
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 min-h-[122px] resize-y rounded-lg px-4 py-2.5 text-base font-normal leading-6 text-on-surface outline-none shadow-[inset_0_0_0_1px_var(--color-surface-container-high)]"
          />
          {errors?.description?.[0] && <span className="text-sm font-normal text-error">{errors.description[0]}</span>}
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          Category
          <span className="relative mt-1">
            <FiTag aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-on-surface-variant" />
            <select
              name="category"
              value={values.category}
              onChange={handleChange}
              className="w-full appearance-none rounded-lg py-2.5 pr-10 pl-11 text-base font-normal text-on-surface outline-none shadow-[inset_0_0_0_1px_var(--color-surface-container-high)]"
            >
              <option value="">Pilih Kategori</option>
              {(values.type == "EXPENSE" ? categoryExpenseOptions : categoryIncomeOptions).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-on-surface-variant">▾</span>
          </span>
          {errors?.category?.[0] && <span className="text-sm font-normal text-error">{errors.category[0]}</span>}
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          Amount
          <span className="mt-1 flex items-center rounded-lg shadow-[inset_0_0_0_1px_var(--color-surface-container-high)]">
            <span className="flex shrink-0 items-center gap-1.5 pl-4 text-[22px] font-bold tracking-[-0.22px] text-on-surface-variant">
              {symbol}
              <span className="h-4 w-px bg-outline-variant" />
            </span>
            {/* <input
              name="amount"
              inputMode="decimal"
              value={values.amount}
              onChange={handleChange}
              className="min-w-0 flex-1 bg-transparent py-2.5 pr-4 pl-2 text-[28px] font-bold tracking-[-0.64px] text-on-surface outline-none sm:text-[32px] sm:leading-9"
            /> */}
            <NumericFormat
              value={amount}
              onValueChange={(values) => { setAmount(values.value); changeValue('amount', new String(values.floatValue)) }}
              thousandSeparator={currency?.split(" ")[0] == 'id-ID' ? "." : ","}
              decimalSeparator={currency?.split(" ")[0] == 'id-ID' ? "," : "."}
              decimalScale={currency?.split(" ")[0] == 'id-ID' ? 0 : 2}
              className="min-w-0 flex-1 bg-transparent py-2.5 pr-4 pl-2 text-[28px] font-bold tracking-[-0.64px] text-on-surface outline-none sm:text-[32px] sm:leading-9" />
          </span>
          {errors?.amount?.[0] && <span className="text-sm font-normal text-error">{errors.amount[0]}</span>}
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          Date & Time
          <span className="relative mt-1">
            {/* <FiCalendar aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-on-surface-variant" /> */}
            <input
              type="datetime-local"
              name="date"
              value={values.date}
              onChange={handleChange}
              className="w-full rounded-lg py-2.5 px-4 text-base font-normal text-on-surface outline-none shadow-[inset_0_0_0_1px_var(--color-surface-container-high)]"
            />
          </span>
          {errors?.date?.[0] && <span className="text-sm font-normal text-error">{errors.date[0]}</span>}
        </label>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-surface-container pt-6 sm:flex-row sm:justify-end">
        <Link href="/dashboard/transactions" className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-container px-8 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary disabled:opacity-60"
        >
          <FiCheck aria-hidden className="size-3.5" />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
