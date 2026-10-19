"use client";

import { useEffect, useId, useState } from "react";
import { FiPlus, FiShield } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { setDailyLimit } from "@/app/actions/dashboard";
import { useForm } from "@/lib/form";
import { useToast } from "../toast";

export function DailyLimitSetup() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const router = useRouter();
  const { values, errors, isPending, handleChange, handleSubmit, setError } = useForm({ dailyLimit: "" });

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const submit = handleSubmit(async (form) => {
    const dailyLimit = Number(form.dailyLimit);
    if (!Number.isFinite(dailyLimit) || dailyLimit < 0) {
      setError("dailyLimit", "Batas harian wajib diisi dan harus berupa angka.");
      return;
    }
    const result = await setDailyLimit(dailyLimit);
    if (!result.success) {
      setError("message", result.message);
      return;
    }
    setOpen(false);
    toast.success("Batas harian berhasil diubah");
    router.refresh();
  });

  const message = errors?.message?.[0] || errors?.dailyLimit?.[0] || "";

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg bg-primary-container px-4 py-2.5 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary"
        onClick={() => setOpen(true)}
      >
        <FiPlus aria-hidden className="size-4" />
        Setup your Daily Limit
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_-12px_rgba(19,27,46,0.3)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <FiShield aria-hidden className="size-4 text-secondary" />
              <h2 id={titleId} className="text-lg font-semibold leading-6 text-on-surface">Daily Limit</h2>
            </div>
            <p className="mt-1 text-sm leading-5 text-on-surface-variant">
              Set a daily spending cap so Dolas can show what is safe to spend today.
            </p>
            <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
              <label className="flex flex-col gap-1 text-[13px] font-semibold text-on-surface" htmlFor="daily-limit">
                Daily Limit
                <input
                  id="daily-limit"
                  name="dailyLimit"
                  inputMode="decimal"
                  value={values.dailyLimit}
                  onChange={handleChange}
                  className="h-10 rounded-lg bg-white px-3 font-normal shadow-[0_0_0_1px_var(--color-surface-container-high)] outline-none focus:shadow-[0_0_0_2px_var(--color-primary)]"
                />
              </label>
              {message && (
                <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
                  {message}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-lg px-4 py-2 text-[13px] font-semibold text-on-surface-variant" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary-container px-4 py-2 text-[13px] font-semibold text-on-primary disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
