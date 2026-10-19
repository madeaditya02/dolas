"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
// import { getApiErrorMessage } from "@/lib/api/errors";
// import { loginAndResolveState } from "@/lib/auth/client-flow";
import { AuthError } from "./auth-frame";
import { FiEye, FiLock, FiUser } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import { login, LoginCredential } from "@/app/actions/auth";
import { useForm } from "@/lib/form";
import { useToast } from "../toast";
import { flashSession } from "@/app/actions/session";

export function LoginForm({ next }: { next?: string }) {
  // const router = useRouter();
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [rememberMe, setRememberMe] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // async function submit(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //   setBusy(true);
  //   setError("");
  //   let state: string | null = null
  //   try {
  //     // const result = await loginAndResolveState({ email, password, rememberMe }, next);
  //     // router.push(result.destination);
  //     // router.refresh();
  //     const result = await login({ email, password, rememberMe })
  //     if (result.state == 'EMAIL_NOT_VERIFIED') {
  //       window.sessionStorage.setItem("finance.pending-verification-email", email);
  //       window.sessionStorage.setItem("finance.verification-resend-available-at", String(Date.now() + 30_000));
  //     }
  //     state = result.state
  //   } catch (error) {
  //     // console.log(error?.response.data)
  //     setError(getApiErrorMessage(error, "Unable to sign in. Please try again."));
  //   } finally {
  //     setBusy(false);
  //   }
  //   if (state) {
  //     if (state == 'EMAIL_NOT_VERIFIED') redirect('/auth/email-verification')
  //     if (state == 'SETUP_REQUIRED') redirect('/auth/setup')
  //     if (state == 'AUTHENTICATED') redirect(next ?? '/')
  //   }
  // }

  const { values, errors, isPending, handleChange, handleSubmit, changeValue } = useForm<LoginCredential>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const submitForm = useCallback(async (form: LoginCredential) => {
    const result = await login(form);
    
    if (result.state == 'EMAIL_NOT_VERIFIED') {
      window.sessionStorage.setItem("finance.pending-verification-email", form.email);
      window.sessionStorage.setItem("finance.verification-resend-available-at", String(Date.now() + 30_000));
    }
    if (result.state) {
      // console.log("Berhasil: ", result.state);
      if (result.state == 'ERROR') return toast.error(result?.message || 'Terjadi kesalahan pada pemrosesan data')
        // return setError(result?.message || 'Terjadi kesalahan pada pemrosesan data')
      if (result.state == 'EMAIL_NOT_VERIFIED') return router.push('/auth/email-verification')
      // await flashSession("auth", "Login berhasil")
      toast.success("Login berhasil")
      if (result.state == 'SETUP_REQUIRED') return router.push('/auth/setup')
      if (result.state == 'AUTHENTICATED') return router.push(next ?? '/')
    }
  }, [])

  return (
    <form className="mt-6 flex w-full flex-col gap-4" onSubmit={handleSubmit(submitForm)}>
      <div>
        <label className="flex flex-col gap-1" htmlFor="login-email">
          <span className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface">Email Address</span>
        </label>
        <div className="relative flex h-9 items-center rounded-lg bg-white shadow-[0_0_0_1px_var(--color-surface-container-high)] focus-within:shadow-[0_0_0_2px_var(--color-primary)]">
          <span className="pointer-events-none absolute left-3.5 flex items-center">
            {/* <FigmaIcon src="/auth-icons/login-email.svg" width={16.667} height= {13.333} /> */}
            <FiUser />
          </span>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            // required
            value={values.email}
            onChange={handleChange}
            placeholder="name@work-or-personal.com"
            className="h-full w-full rounded-lg bg-transparent py-2 pl-11 pr-4 text-sm text-on-surface outline-none placeholder:text-outline/70"
          />
        </div>
        {errors?.email && <p className="text-red-500 mt-1 text-sm">{errors?.email}</p>}
      </div>

      <label className="flex flex-col gap-1" htmlFor="login-password">
        <span className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface">Password</span>
        <span className="relative flex h-9 items-center rounded-lg bg-white shadow-[0_0_0_1px_var(--color-surface-container-high)] focus-within:shadow-[0_0_0_2px_var(--color-primary)]">
          <span className="pointer-events-none absolute left-4 flex items-center">
            <FiLock />
            {/* <FigmaIcon src="/auth-icons/login-lock.svg" width={13.333} height={17.5} /> */}
          </span>
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            // required
            value={values.password}
            onChange={handleChange}
            placeholder="Create a secure password"
            className="h-full w-full rounded-lg bg-transparent py-2 pl-11 pr-11 text-sm text-on-surface outline-none placeholder:text-outline/70"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-2.5 flex size-7 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
          >
            <FiEye />
            {/* <FigmaIcon src="/auth-icons/login-eye.svg" width={18.333} height={12.5} /> */}
          </button>
        </span>
        {errors?.password && <p className="text-red-500 mt-1 text-sm">{errors?.password}</p>}
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-[13px] leading-4 text-on-surface-variant">
        <input
          type="checkbox"
          checked={values.rememberMe}
          onChange={(event) => changeValue('rememberMe', event.target.checked)}
          className="size-3 accent-primary"
        />
        Remember Me
      </label>

      <AuthError message={error} />

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary-container px-4 py-3 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-primary shadow-sm transition hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? "Signing in…" : "Sign In to Account"}
        {!isPending && <FaArrowRight />}
      </button>

      <p className="pt-1 text-center text-[13px] leading-4.5s text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-semibold text-secondary hover:underline">Register</Link>
      </p>
    </form>
  );
}
