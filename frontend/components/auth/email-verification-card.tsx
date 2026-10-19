"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getVerificationFlowSnapshot,
  getVerificationResendAvailableAt,
  subscribeVerificationFlow,
  setVerificationResendAvailableAt,
  VERIFICATION_RESEND_DELAY_MS,
  savePendingVerificationEmail,
} from "@/lib/auth/browser-flow";
import { AuthCard, AuthError, AuthFrame } from "./auth-frame";
import { IoMailUnread } from "react-icons/io5";
import { MdOutlineVerified } from "react-icons/md";
import { GoMention } from "react-icons/go";
import { HiOutlineRefresh } from "react-icons/hi";
import { FiInfo } from "react-icons/fi";
import { apiClient } from "@/lib/api/client";

export function EmailVerificationCard() {
  const flowSnapshot = useSyncExternalStore(subscribeVerificationFlow, getVerificationFlowSnapshot, () => "[null,null]");
  const [email, resendAt] = JSON.parse(flowSnapshot) as [string | null, number | null];
  const [remaining, setRemaining] = useState(30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let availableAt = getVerificationResendAvailableAt();
    if (email && availableAt === null) {
      availableAt = Date.now() + VERIFICATION_RESEND_DELAY_MS;
      setVerificationResendAvailableAt(availableAt);
    }
  }, [email, resendAt]);

  useEffect(() => {
    const updateRemaining = () => {
      setRemaining(Math.max(0, Math.ceil(((resendAt ?? Date.now()) - Date.now()) / 1000)));
    };
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  async function resend() {
    if (!email || remaining > 0 || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiClient.post('/auth/resend-verification', { email });
      savePendingVerificationEmail(email);
      setVerificationResendAvailableAt(Date.now() + VERIFICATION_RESEND_DELAY_MS);
      // await resendPendingVerification(email);
      setRemaining(30);
      setMessage("A new verification link has been sent.");
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Unable to resend the verification email."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame>
      <AuthCard accent={false} radiusClassName="rounded-xl" shadowClassName="shadow-[0_1px_1px_rgba(0,0,0,0.05)]" className="max-w-140 px-6 py-8 sm:px-14">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 flex size-20 items-center justify-center rounded-full bg-surface-container shadow-sm">
            {/* <FigmaIcon src="/auth-icons/verify-mail.svg" width={30} height={27} /> */}
            <IoMailUnread className="size-10" />
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary shadow-sm">
              <MdOutlineVerified className="text-white" />
              {/* <FigmaIcon src="/auth-icons/verify-badge.svg" width={14.667} height={14} /> */}
            </span>
          </div>
          <h1 className="pb-2 text-[28px] font-bold leading-10 tracking-[-0.8px] text-on-surface sm:text-[32px]">Check your email</h1>
          <p className="max-w-105 text-sm leading-[22.75px] text-on-surface-variant">
            We have dispatched an activation link to your registered email address. Please click the link to confirm your identity and unlock your financial workspace.
          </p>

          <div className="mt-7 flex min-h-8.5 w-full max-w-105 items-center gap-2 rounded-lg bg-surface-container-low px-3 text-left">
            {/* <FigmaIcon src="/auth-icons/verify-address.svg" width={16.667} height={16.667} /> */}
            <GoMention />
            {email ? (
              <span className="truncate text-[13px] font-semibold text-on-surface">{email}</span>
            ) : (
              <span className="text-[13px] text-on-surface-variant">No pending email in this tab.</span>
            )}
          </div>

          <div className="mt-6 w-full max-w-105">
            <button
              type="button"
              disabled={!email || remaining > 0 || busy}
              onClick={resend}
              className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary-container hover:bg-primary text-white px-6 py-3 text-[13px] font-semibold shadow-sm transition disabled:hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white disabled:text-on-surface"
            >
              <HiOutlineRefresh />
              {/* <FigmaIcon src="/auth-icons/verify-resend.svg" width={12} height={12} /> */}
              {busy ? "Sending…" : "Resend verification link"}
            </button>
            <p className="mt-2 text-center text-[11px] font-bold leading-3.5 tracking-[0.44px] text-on-surface-variant" aria-live="polite">
              {remaining > 0 ? <>Resend available in <span className="text-[13px] text-primary">{remaining}</span> s</> : "You can request another link now."}
            </p>
            <p role="status" className="mt-2 text-center text-sm text-primary">{message}</p>
            <AuthError message={error} />
          </div>

          <aside className="mt-6 flex w-full max-w-105 items-start gap-2 rounded-lg bg-surface-container p-4 text-left">
            <FiInfo className="w-6" />
            {/* <FigmaIcon src="/auth-icons/verify-info.svg" width={16.667} height={18.667} /> */}
            <div>
              <h2 className="text-[11px] font-bold uppercase leading-3.5 tracking-[0.55px] text-on-surface">Didn’t receive the email?</h2>
              <p className="mt-0.5 text-[13px] leading-4.5 text-on-surface-variant">
                Check your spam or junk folder. Activation tokens expire automatically after 1 hour for your protection.
              </p>
            </div>
          </aside>

          {!email && <Link href="/auth/register" className="mt-5 text-sm font-semibold text-secondary hover:underline">Return to registration</Link>}
        </div>
      </AuthCard>
    </AuthFrame>
  );
}
