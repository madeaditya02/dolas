"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ name }: { name: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full py-1 pr-1 text-left"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary">
          {initials(name)}
        </span>
        <span className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface-variant">
          {name}
        </span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-44 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest py-1 shadow-[0_12px_24px_-8px_rgba(19,27,46,0.18)]"
        >
          {pathname.startsWith("/dashboard") ? (
            <Link
            href="/"
            role="menuitem"
            className="block px-3 py-2 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>)
           : (
            <Link
              href="/dashboard"
              role="menuitem"
              className="block px-3 py-2 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            role="menuitem"
            className="block px-3 py-2 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-[13px] font-semibold text-error hover:bg-error-container"
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
