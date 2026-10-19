"use client";

import { redirect } from "next/navigation";
import { ChangeEvent, useMemo, useState, type FormEvent } from "react";
// import { getApiErrorMessage } from "@/lib/api/errors";
// import { completeSetupAndResolveState } from "@/lib/auth/client-flow";
import { AuthError, FigmaIcon } from "./auth-frame";
// import { readSessionToken } from "@/app/actions/session";
import { useForm } from "@/lib/form";
import { apiClient } from "@/lib/api/client";
import { NumericFormat } from 'react-number-format';
import { FaCheckCircle } from "react-icons/fa";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { getToken, setToken } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";

const currencies = [
  { code: "USD", lang: "en-EN", label: "USD ($)", symbol: "$", fractionDigits: 2 },
  { code: "IDR", lang: "id-ID", label: "IDR (Rp)", symbol: "Rp", fractionDigits: 0 },
  { code: "SGD", lang: "en-EN", label: "SGD (S$)", symbol: "S$", fractionDigits: 2 },
  { code: "EUR", lang: "en-EN", label: "EUR (€)", symbol: "€", fractionDigits: 2 },
];
const presets = [1000, 2500, 5000, 10000];
const presetsIDR = [100000, 250000, 500000, 1000000];

interface SetupFormValues {
  currency: string;
  balance: number;
  language: string;
}

export function SetupForm() {
  const router = useRouter();
  // const [currency, setCurrency] = useState("USD");
  const [balance, setBalance] = useState("0.00");
  // const [busy, setBusy] = useState(false);
  // const [error, setError] = useState("");
  
  const { values, errors, isPending, handleSubmit, changeValue } = useForm<SetupFormValues>({
    currency: currencies[0]?.code ?? "USD",
    balance: 0,
    language: currencies[0]?.lang ?? "en-EN",
  }, '/')
  const currencyInfo = currencies.find((item) => item.code === values.currency) ?? currencies[0]!;
  const amount = useMemo(() => Number(values.balance || 0), [values.balance]);

  const formattedAmount = new Intl.NumberFormat(currencyInfo.lang, {
    minimumFractionDigits: currencyInfo.fractionDigits,
    maximumFractionDigits: currencyInfo.fractionDigits,
  }).format(Number.isFinite(amount) ? amount : 0);

  function formatPreset(value: number) {
    const formatted = new Intl.NumberFormat(currencyInfo.lang, {
      minimumFractionDigits: currencyInfo.fractionDigits,
      maximumFractionDigits: currencyInfo.fractionDigits,
    }).format(value);
    return `${currencyInfo.symbol}${formatted}`;
  }

  // function changeBalance(event: ChangeEvent<HTMLInputElement, HTMLInputElement>) {
  //   const pureNumber = event.target.value.replace(/\D/g, "");
  //   console.log(pureNumber)
  //   if (currencyInfo.fractionDigits == 0) {
  //     // clean number and parse to number (e.g. 01.00 -> 1.0, 0.10 -> 0.1 -> 0.01 -> 10.00 -> 10.0, etc)
  //     // changeValue('balance', Number(pureNumber.replace(/^0+/, "").slice(0, -2)))
  //     // changeValue('balance', Number(pureNumber.slice(0, -2)))
  //     changeValue('balance', Number(pureNumber))
  //   } else {
  //     // changeValue('balance', Number(event.target.value.replace(',', '')))
  //   }
  // }
  
  function changeCurrency(event: ChangeEvent<HTMLSelectElement>) {
    changeValue('currency', event.target.value)
    changeValue('language', currencies.find((item) => item.code === event.target.value)?.lang ?? "en-EN")
  }

  const submitForm = async (values: SetupFormValues) => {
    // values.currency = `${values.language} ${values.currency}`
    const { data } = await apiClient.post<{success: true, message: string, token: string}>('/auth/setup', { ...values, currency: `${values.language} ${values.currency}`}, {
      headers: {
        Authorization: `Bearer ${await getToken()}`
      }
    })
    await setToken(data.token)
    router.push('/')
  };

  // async function submit(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   setError("");
  //   if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
  //     setError("Enter a valid whole-number balance of zero or more.");
  //     return;
  //   }

  //   setBusy(true);
  //   try {
  //     const currencyPayload = `${currencyInfo.lang} ${currency}`
  //     const result = await completeSetupAndResolveState({ currency: currencyPayload, balance: amount });
  //     router.push(result.destination);
  //     router.refresh();
  //   } catch (cause) {
  //     setError(getApiErrorMessage(cause, "Unable to save your starting balance."));
  //   } finally {
  //     setBusy(false);
  //   }
  // }

  return (
    <form onSubmit={handleSubmit(submitForm)} className="w-full">
      <div className="mb-3 flex w-full items-center justify-between px-2">
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold leading-4 tracking-[0.13px] text-secondary">
          {/* <FigmaIcon src="/auth-icons/setup-verified.svg" width={15} height={15} /> */}
          <FaCheckCircle className="h-4.5" />
          Account Verified
        </span>
        <a href="/" className="inline-flex items-center gap-1.5 text-[13px] hover:underline"><FaArrowLeft/> Back to Home</a>
        {/* <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-[14px] tracking-[0.55px] text-on-surface-variant">
          Step 2 of 2
          <span className="flex gap-1.5" aria-hidden="true"><span className="h-1.5 w-5 rounded-full bg-primary-container" /><span className="h-1.5 w-5 rounded-full bg-primary-container" /></span>
        </span> */}
      </div>

      <section className="relative w-full rounded-xl bg-surface-container-lowest p-6 shadow-[0_20px_25px_-5px_rgba(19,27,46,0.05),0_8px_10px_-6px_rgba(19,27,46,0.05)] sm:p-8">
        <header className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-container">
            {/* <FigmaIcon src="/auth-icons/setup-wallet.svg" width={20.583} height={19.5} /> */}
            <MdOutlineAccountBalanceWallet className="size-7 text-primary-container" />
          </div>
          <h1 className="text-[28px] font-bold leading-10 tracking-[-0.8px] text-on-surface sm:text-[32px]">Set your starting balance</h1>
          <p className="mt-1 max-w-[420px] text-sm leading-5 text-on-surface-variant">
            To calibrate your Safe-to-Spend guardrails and initial cashflow trajectory, enter your current liquid capital across primary checking and savings.
          </p>
        </header>

        <div className="mt-6 rounded-xl bg-surface-container-low p-5 sm:p-6">
          <div className="flex min-w-0 items-center justify-center gap-2 sm:gap-3">
            <label className="relative shrink-0" htmlFor="setup-currency">
              <span className="sr-only">Currency</span>
              <select id="setup-currency" value={values.currency} onChange={changeCurrency} className="h-[34px] appearance-none rounded-lg bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-on-surface shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {currencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                <FigmaIcon src="/auth-icons/setup-chevron.svg" width={9} height={5.55} />
              </span>
            </label>
            <NumericFormat
              value={balance}
              onValueChange={(values) => { setBalance(values.value); changeValue('balance', values.floatValue) }}
              thousandSeparator={currencyInfo.lang == 'id-ID' ? "." : ","}
              decimalSeparator={currencyInfo.lang == 'id-ID' ? "," : "."}
              decimalScale={currencyInfo.fractionDigits}
              className="min-w-0 flex-1 bg-transparent text-[36px] font-extrabold leading-[1.15] tracking-[-1.1px] text-on-surface outline-none sm:text-[44px]" />
            {/* <input
              aria-label={`Starting balance in ${values.currency}`}
              name="balance"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              value={formattedAmount}
              onChange={changeBalance}
              className="min-w-0 flex-1 bg-transparent text-[36px] font-extrabold leading-[1.15] tracking-[-1.1px] text-on-surface outline-none sm:text-[44px]"
            /> */}
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium leading-[14px] tracking-[0.44px] text-error">
            <FigmaIcon src="/auth-icons/setup-warning.svg" width={20} height={20} />
            This sets your opening balance.
          </p>
        </div>

        <div className="mt-3">
          <p className="px-1 text-[11px] font-bold uppercase leading-[14px] tracking-[0.55px] text-on-surface-variant">Quick presets</p>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(currencyInfo.code == "IDR" ? presetsIDR : presets).map((value) => (
              <button key={value} type="button" onClick={() => { changeValue('balance', value); setBalance(formatPreset(value)) }} aria-pressed={amount === value} className={`rounded-lg px-2 py-2 text-[13px] font-semibold leading-4 tracking-[0.13px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${amount === value ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"}`}>
                {formatPreset(value)}
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={() => {setBalance("0.00"); changeValue('balance', 0)}} className="text-[11px] font-bold leading-[14px] tracking-[0.44px] text-on-surface-variant underline underline-offset-2 hover:text-primary">
              Start with fresh zero ({formatPreset(0)})
            </button>
          </div>
        </div>

        <div className="mt-4">
          <AuthError message={errors?.[Object.keys(errors)[0]]?.[0] ?? ""} />
          <button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary-container px-6 py-3.5 text-[13px] font-bold leading-4 tracking-[0.13px] text-on-primary shadow-sm transition hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70">
            {isPending ? "Saving…" : "Continue to Dashboard"}
            {!isPending && <FigmaIcon src="/auth-icons/setup-arrow.svg" width={12} height={12} />}
          </button>
        </div>
      </section>
    </form>
  );
}
