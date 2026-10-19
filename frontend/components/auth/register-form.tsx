"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api/errors";
// import { registerForVerification } from "@/lib/auth/client-flow";
import { AuthError } from "./auth-frame";
import { FiEye, FiLock, FiMail, FiUser } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import { useForm } from "@/lib/form";
import { RegisterCredential } from "@/app/actions/auth";
import { apiClient } from "@/lib/api/client";
import { AxiosError } from "axios";

export function RegisterForm() {
  const router = useRouter();
  // const [name, setName] = useState("");
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // async function submit(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   setError("");
  //   if (!hasEightCharacters || !hasNumberOrSymbol) {
  //     setError("Use at least 8 characters and include a number or symbol.");
  //     return;
  //   }
  //   if (!acceptedTerms) {
  //     setError("Please agree to the Terms of Service and Privacy Policy.");
  //     return;
  //   }

  //   setBusy(true);
  //   try {
  //     await registerForVerification({ name, email, password });
  //     router.push("/auth/email-verification");
  //   } catch (cause) {
  //     setError(getApiErrorMessage(cause, "Unable to create your account. Please try again."));
  //   } finally {
  //     setBusy(false);
  //   }
  // }

  const { values, errors, isPending, handleChange, handleSubmit, setError } = useForm({
    name: '',
    email: '',
    password: '',
    acceptedTerms: false,
  })

  const hasEightCharacters = values.password.length >= 8;
  const hasNumberOrSymbol = /[\d]|[^\p{L}\p{N}\s]/u.test(values.password);

  const submitForm = useCallback(async (form: RegisterCredential) => {
    try {
      await apiClient.post<{ success: true; message: string;}>('/auth/register', form)
      window.sessionStorage.setItem("finance.pending-verification-email", form.email);
      window.sessionStorage.setItem("finance.verification-resend-available-at", String(Date.now() + 30_000));
      router.push('/auth/email-verification')
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          setError('email', error.response.data.message)
        } else {
          setErrorMsg(getApiErrorMessage(error, "Internal server error"))
        }
      } else {
        setErrorMsg(getApiErrorMessage(error, "Internal server error"))
      }
    }
  }, []);

  return (
    <form className="mt-6 flex w-full flex-col gap-4" onSubmit={handleSubmit(submitForm)}>
      <label className="flex flex-col gap-1" htmlFor="register-name">
        <span className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface">Full Name</span>
        <span className="relative flex h-9 items-center rounded-lg bg-white shadow-[0_0_0_1px_var(--color-surface-container-high)] focus-within:shadow-[0_0_0_2px_var(--color-primary)]">
          <span className="pointer-events-none absolute left-3.5 flex items-center">
            <FiUser />
            {/* <FigmaIcon src="/auth-icons/register-name.svg" width={13.333} height={13.333} /> */}
          </span>
          <input id="register-name" name="name" autoComplete="name" required value={values.name} onChange={handleChange} placeholder="e.g. David Chen" className="h-full w-full rounded-lg bg-transparent py-2 pl-11 pr-4 text-sm text-on-surface outline-none placeholder:text-outline/70" />
        </span>
        {errors?.name && <p className="text-red-500 mt-1 text-sm">{errors?.name}</p>}
      </label>

      <label className="flex flex-col gap-1" htmlFor="register-email">
        <span className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface">Email Address</span>
        <span className="relative flex h-9 items-center rounded-lg bg-white shadow-[0_0_0_1px_var(--color-surface-container-high)] focus-within:shadow-[0_0_0_2px_var(--color-primary)]">
          <span className="pointer-events-none absolute left-3.5 flex items-center">
            <FiMail />
            {/* <FigmaIcon src="/auth-icons/register-email.svg" width={16.667} height={13.333} /> */}
          </span>
          <input id="register-email" name="email" type="email" autoComplete="email" required value={values.email} onChange={handleChange} placeholder="name@work-or-personal.com" className="h-full w-full rounded-lg bg-transparent py-2 pl-11 pr-4 text-sm text-on-surface outline-none placeholder:text-outline/70" />
        </span>
        {errors?.email && <p className="text-red-500 mt-1 text-sm">{errors?.email}</p>}
      </label>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface" htmlFor="register-password">Password</label>
        <span className="relative flex h-9 items-center rounded-lg bg-white shadow-[0_0_0_1px_var(--color-surface-container-high)] focus-within:shadow-[0_0_0_2px_var(--color-primary)]">
          <span className="pointer-events-none absolute left-4 flex items-center">
            <FiLock />
            {/* <FigmaIcon src="/auth-icons/register-lock.svg" width={13.333} height={17.5} /> */}
          </span>
          <input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={values.password} onChange={handleChange} placeholder="Create a secure password" className="h-full w-full rounded-lg bg-transparent py-2 pl-11 pr-11 text-sm text-on-surface outline-none placeholder:text-outline/70" />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2.5 flex size-7 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary">
            <FiEye />
            {/* <FigmaIcon src="/auth-icons/register-eye.svg" width={18.333} height={12.5} /> */}
          </button>
        </span>
        <div className="flex flex-col gap-2 pt-2" aria-live="polite">
          <div className="grid grid-cols-4 gap-1.5" aria-label="Password strength">
            {[0, 1, 2, 3].map((part) => <span key={part} className={`h-1.5 rounded-full ${values.password.length === 0 ? "bg-surface-container-high" : hasEightCharacters && hasNumberOrSymbol ? "bg-primary-container" : part < (hasEightCharacters || hasNumberOrSymbol ? 2 : 1) ? "bg-secondary" : "bg-surface-container-high"}`} />)}
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] font-bold leading-3.5 tracking-[0.44px] text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className={`inline-block size-2.5 rounded-full border${hasEightCharacters ? " bg-primary-container border-primary-container" : ""}`}></span>
              {/* <FigmaIcon src="/auth-icons/register-check.svg" width={11.667} height={11.667} /> */}
              <span className={hasEightCharacters ? "text-primary" : ""}>At least 8 characters</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`inline-block size-2.5 rounded-full border${hasNumberOrSymbol ? " bg-primary-container border-primary-container" : ""}`}></span>
              <span className={hasNumberOrSymbol ? "text-primary" : ""}>Includes numbers or symbols</span>
            </span>
          </div>
        </div>
        {errors?.password && <p className="text-red-500 mt-1 text-sm">{errors?.password}</p>}
      </div>

      <label className="flex cursor-pointer items-start gap-2 pt-1 text-[13px] leading-4.5 text-on-surface-variant">
        <input type="checkbox" required name="acceptedTerms" onChange={handleChange} className="mt-0.5 size-3.25 shrink-0 accent-primary" />
        <span>I agree to the <span className="text-secondary">Terms of Service</span> and <span className="text-secondary">Privacy Policy</span>. Zero data monetization guarantee.</span>
      </label>

      {/* <AuthError message={error} /> */}

      <button type="submit" disabled={isPending || !hasEightCharacters || !hasNumberOrSymbol || !values.acceptedTerms} className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary-container px-4 py-3 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-primary shadow-sm transition hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70">
        {isPending ? "Creating account…" : "Create Free Account"}
        {!isPending && <FaArrowRight />}
      </button>

      <p className="pt-1 text-center text-[13px] leading-4.5 text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/auth" className="font-semibold text-secondary hover:underline">Log In</Link>
      </p>
    </form>
  );
}
