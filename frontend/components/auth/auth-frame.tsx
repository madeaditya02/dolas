import type { ReactNode } from "react";

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-surface px-4 py-10 sm:px-8">
      <div aria-hidden="true" className="auth-glow-left pointer-events-none absolute -left-40 top-[32%] h-[320px] w-[384px] rounded-full blur-2xl" />
      <div aria-hidden="true" className="auth-glow-right pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full blur-3xl" />
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </main>
  );
}

export function AuthCard({
  children,
  className = "",
  accent = true,
  shadowClassName = "shadow-[0_20px_25px_-5px_rgba(45,106,72,0.05),0_8px_10px_-6px_rgba(45,106,72,0.05)]",
  radiusClassName = "rounded-2xl",
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  shadowClassName?: string;
  radiusClassName?: string;
}) {
  return (
    <section className={`relative w-full overflow-hidden ${radiusClassName} bg-surface-container-lowest ${shadowClassName} ${className}`}>
      {accent && <div aria-hidden="true" className="auth-card-accent absolute inset-x-0 top-0 h-1" />}
      {children}
    </section>
  );
}

export function FigmaIcon({
  src,
  width,
  height,
  alt = "",
}: {
  src: string;
  width: number;
  height: number;
  alt?: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={width} height={height} alt={alt} />;
}

export function AuthIntro({ title, description }: { title: string; description: ReactNode }) {
  return (
    <header className="flex w-full flex-col items-center text-center">
      <h1 className="text-[28px] font-bold leading-9 tracking-[-0.8px] text-on-surface sm:text-[32px] sm:leading-10">
        {title}
      </h1>
      <div className="mt-1 max-w-full text-sm leading-5 text-on-surface-variant">{description}</div>
    </header>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
      {message}
    </p>
  );
}
