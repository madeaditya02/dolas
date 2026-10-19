"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { FiFileText, FiGrid, FiMenu } from "react-icons/fi";
import { UserMenu } from "@/components/home/user-menu";

const links = [
  { href: "/dashboard", label: "Overview", icon: FiGrid, exact: true },
  { href: "/dashboard/transactions", label: "Transactions", icon: FiFileText, exact: false },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-1 pt-1">
      <Image src="/dolas-logo.png" alt="" width={32} height={32} className="size-8" />
      <span className="text-lg leading-6 tracking-[-0.45px]">
        <span className="font-bold text-primary">Dolas</span>{" "}
        <span className="font-normal tracking-[-0.18px] text-on-surface-variant">Finance</span>
      </span>
    </Link>
  );
}

function SideNav({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav className="mt-6 flex flex-col gap-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold leading-4 tracking-[0.13px] ${active ? "bg-primary-container text-on-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`}
          >
            <Icon aria-hidden className="size-[15px]" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-svh bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-surface-container-high bg-white px-4 py-4 lg:flex">
        <Brand />
        <SideNav pathname={pathname} onNavigate={() => undefined} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-on-surface/40" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white px-4 py-4 shadow-xl">
            <Brand />
            <SideNav pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-surface-container-high bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg text-on-surface lg:hidden"
            aria-label="Buka menu"
            onClick={() => setOpen(true)}
          >
            <FiMenu aria-hidden className="size-5" />
          </button>
          <div className="ml-auto">
            <UserMenu name={userName} />
          </div>
        </header>
        <div className="p-4 sm:p-8 flex-1 min-h-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}
