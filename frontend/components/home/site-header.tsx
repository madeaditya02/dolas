import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./user-menu";

export function SiteHeader({ userName }: { userName: string | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-container-high bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/dolas-logo.png" alt="" width={32} height={32} className="size-8" priority />
          <span className="text-lg font-bold leading-6 tracking-[-0.45px] text-primary">Dolas Finance</span>
        </Link>
        {userName ? (
          <UserMenu name={userName} />
        ) : (
          <nav className="flex items-center gap-4 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface-variant">
            <Link href="/auth" className="hover:text-on-surface">Log In</Link>
            <Link href="/auth/register" className="hover:text-on-surface">Sign Up</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
