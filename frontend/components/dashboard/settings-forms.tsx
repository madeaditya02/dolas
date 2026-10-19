"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { NumericFormat } from "react-number-format";
import { FiCheck, FiCheckCircle, FiCircle, FiLock, FiPlus, FiUser, FiX } from "react-icons/fi";
import { updatePassword, updateProfile } from "@/app/actions/auth";
import { useToast } from "@/components/toast";
import { useForm } from "@/lib/form";
import Input from "../input";

const currencies = [
  { code: "USD", lang: "en-US", label: "USD ($) - United States Dollar", symbol: "$", fractionDigits: 2, thousand: ",", decimal: "." },
  { code: "IDR", lang: "id-ID", label: "IDR (Rp) - Indonesian Rupiah", symbol: "Rp", fractionDigits: 0, thousand: ".", decimal: "," },
  { code: "EUR", lang: "de-DE", label: "EUR (€) - Euro", symbol: "€", fractionDigits: 2, thousand: ".", decimal: "," },
  { code: "SGD", lang: "en-SG", label: "SGD (S$) - Singapore Dollar", symbol: "S$", fractionDigits: 2, thousand: ",", decimal: "." },
];

function currencyFromValue(value: string | null) {
  const code = value?.trim().split(/\s+/).at(-1) || "IDR";
  return currencies.find((item) => item.code === code) ?? currencies[1]!;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.[0]) return null;
  return <p className="text-sm font-normal text-error">{messages[0]}</p>;
}

const fieldClass = "w-full rounded-lg border border-surface-container-high bg-white px-4 py-2.5 text-sm leading-5 text-on-surface shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function SettingsForms({
  name,
  email,
  currency,
  dailyLimit,
}: {
  name: string;
  email: string;
  currency: string | null;
  dailyLimit: number | null;
}) {
  const [tab, setTab] = useState<"profile" | "password">("profile");

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="pb-2">
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.8px] text-on-surface">Settings</h1>
        <p className="mt-1 text-sm leading-5 text-on-surface-variant">Manage your personal profile, financial preferences, and account security.</p>
      </header>

      <div className="flex w-full max-w-md gap-2 rounded-xl bg-surface-container-low p-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        <TabButton active={tab === "profile"} icon={<FiUser aria-hidden className="size-3" />} label="Profile & Account" onClick={() => setTab("profile")} />
        <TabButton active={tab === "password"} icon={<FiLock aria-hidden className="size-3.5" />} label="Update Password" onClick={() => setTab("password")} />
      </div>

      <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-8">
        {tab === "profile" ? (
          <ProfileForm key={`${name}|${currency ?? ""}|${dailyLimit ?? "none"}`} name={name} email={email} currency={currency} dailyLimit={dailyLimit} />
        ) : (
          <PasswordForm />
        )}
      </section>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold tracking-[0.13px] sm:px-4 ${active ? "bg-white text-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]" : "text-on-surface-variant"}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function ProfileForm({
  name,
  email,
  currency,
  dailyLimit,
}: {
  name: string;
  email: string;
  currency: string | null;
  dailyLimit: number | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const initialCurrency = currencyFromValue(currency);
  const { values, errors, isPending, handleChange, changeValue, setError, resetForm, handleSubmit } = useForm({
    name,
    currency: initialCurrency.code,
    dailyLimit: dailyLimit == null ? "" : String(dailyLimit),
  });
  const [limitEnabled, setLimitEnabled] = useState(dailyLimit != null);
  const [amountReady, setAmountReady] = useState(false);
  useEffect(() => setAmountReady(true), []);
  const selected = currencies.find((item) => item.code === values.currency) ?? initialCurrency;

  const submit = handleSubmit(async (form) => {
    const amountText = form.dailyLimit.trim();
    const dailyLimitValue = !limitEnabled
      ? null
      : amountText !== "" && Number.isFinite(Number(amountText))
        ? Number(amountText)
        : amountText;
    const result = await updateProfile({
      name: form.name,
      currency: `${selected.lang} ${selected.code}`,
      dailyLimit: dailyLimitValue,
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

    toast.success(result.message);
    router.refresh();
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <h2 className="text-lg font-semibold leading-6 tracking-[-0.18px] text-on-surface">Profile & Account Preferences</h2>
      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          <span>Full Name <span className="text-error">*</span></span>
          <Input name="name" value={values.name} onChange={handleChange} error={errors?.name?.[0]} />
          <FieldError messages={errors?.name} />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          Email Address
          <Input value={email} readOnly className={`bg-surface-container-low/70 text-on-surface-variant read-only:bg-surface-container-low`} />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          <span>Reporting Currency <span className="text-error">*</span></span>
          <span className="relative">
            <select name="currency" value={values.currency} onChange={handleChange} className={`${fieldClass} appearance-none pr-10 ${errors?.currency?.[0] ? "border-error" : "border-surface-container-high"}`}>
              {currencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-on-surface-variant">▾</span>
          </span>
          <FieldError messages={errors?.currency} />
        </label>

        {limitEnabled ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold tracking-[0.13px] text-on-surface">Batas Pengeluaran Harian (Daily Safe Limit)</span>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-surface-container-high bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <span className="flex items-center self-stretch bg-surface-container-low px-3.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">{selected.symbol}</span>
                {amountReady ? (
                  <NumericFormat
                    value={values.dailyLimit}
                    thousandSeparator={selected.thousand}
                    decimalSeparator={selected.decimal}
                    decimalScale={selected.fractionDigits}
                    fixedDecimalScale={selected.fractionDigits > 0}
                    allowNegative={false}
                    onValueChange={(next) => {
                      if (next.value !== values.dailyLimit) changeValue("dailyLimit", next.value);
                    }}
                    className={`min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm leading-5 text-on-surface outline-none ${errors?.dailyLimit?.[0] ? "border-error" : "border-surface-container-high"}`}
                    aria-label="Daily Safe Limit"
                  />
                ) : (
                  <input readOnly value={values.dailyLimit} aria-label="Daily Safe Limit" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm leading-5 text-on-surface outline-none" />
                )}
              </span>
              <button type="button" onClick={() => setLimitEnabled(false)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-error px-4 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-error">
                <FiX aria-hidden className="size-3.5" />
                Stop Daily Limit
              </button>
            </div>
            <FieldError messages={errors?.dailyLimit} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-[0.13px] text-on-surface">Daily Safe Limit</p>
              <p className="mt-1.5 text-[13px] leading-[18px] text-on-surface-variant">Start setup your daily limit of spending and track your spending so you don&apos;t go over your limit</p>
              <FieldError messages={errors?.dailyLimit} />
            </div>
            <button type="button" onClick={() => setLimitEnabled(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <FiPlus aria-hidden className="size-3.5" />
              Setup your Daily Limit
            </button>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setLimitEnabled(dailyLimit != null);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-surface-container-low px-4 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface sm:min-w-45"
          >
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-container px-4 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-60 sm:min-w-45">
            <FiCheck aria-hidden className="size-3.5" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const { values, errors, isPending, handleChange, setError, resetForm, handleSubmit } = useForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const lengthOk = values.newPassword.length >= 8;
  const symbolOk = /[\d]|[^\p{L}\p{N}\s]/u.test(values.newPassword);
  const score = [values.newPassword.length > 0, values.newPassword.length >= 4, lengthOk, symbolOk].filter(Boolean).length;

  const submit = handleSubmit(async (form) => {
    const result = await updatePassword(form);
    if (!result.success) {
      if (result.errors) {
        for (const [field, messages] of Object.entries(result.errors)) {
          if (messages?.length) setError(field, messages);
        }
      }
      if (!result.errors || Object.keys(result.errors).length === 0) toast.error(result.message);
      return;
    }
    resetForm();
    toast.success(result.message);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <h2 className="text-lg font-semibold leading-6 tracking-[-0.18px] text-on-surface">Update Password</h2>
      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          <span>Current Password <span className="text-error">*</span></span>
          <input type="password" name="currentPassword" autoComplete="current-password" placeholder="Your current password" value={values.currentPassword} onChange={handleChange} className={`${fieldClass} placeholder:text-[#bbb]`} />
          <FieldError messages={errors?.currentPassword} />
        </label>

        <div className="flex flex-col gap-1.5">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
            <span>New Password <span className="text-error">*</span></span>
            <input type="password" name="newPassword" autoComplete="new-password" placeholder="New password for update" value={values.newPassword} onChange={handleChange} className={`${fieldClass} placeholder:text-[#bbb]`} />
          </label>
          <div className="flex gap-1.5 pt-2">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index < score ? "bg-primary-container" : "bg-surface-container-high"}`} />
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <PasswordHint met={lengthOk} label="At least 8 characters" />
            <PasswordHint met={symbolOk} label="Includes numbers or symbols" />
          </div>
          <FieldError messages={errors?.newPassword} />
        </div>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface">
          <span>Confirm New Password <span className="text-error">*</span></span>
          <input type="password" name="confirmPassword" autoComplete="new-password" placeholder="Retype your new password" value={values.confirmPassword} onChange={handleChange} className={`${fieldClass} placeholder:text-[#bbb]`} />
          <FieldError messages={errors?.confirmPassword} />
        </label>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={resetForm} className="inline-flex items-center justify-center rounded-lg bg-surface-container-low px-4 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-on-surface sm:min-w-45">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-container px-4 py-2.5 text-[13px] font-semibold tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-60 sm:min-w-45">
            <FiCheck aria-hidden className="size-3.5" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PasswordHint({ met, label }: { met: boolean; label: string }) {
  const Icon = met ? FiCheckCircle : FiCircle;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.44px] ${met ? "text-secondary" : "text-on-surface-variant"}`}>
      <Icon aria-hidden className="size-3" />
      {label}
    </span>
  );
}
