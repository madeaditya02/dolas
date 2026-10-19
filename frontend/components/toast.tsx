"use client";

import { getFlashSession } from "@/app/actions/session";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { FiX } from "react-icons/fi";

export type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const TOAST_DURATION_MS = 5000;
const emptyToasts: ToastItem[] = [];

let nextId = 1;
let toasts: ToastItem[] = emptyToasts;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function dismiss(id: number) {
  const next = toasts.filter((item) => item.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

function push(tone: ToastTone, message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, tone, message }];
  emit();
  window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
}

export const toast = {
  success(message: string) {
    push("success", message);
  },
  error(message: string) {
    push("error", message);
  },
  dismiss,
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

function getServerSnapshot() {
  return emptyToasts;
}

export function useToast() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return toast;
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      {items.map((item) => (
        <article
          key={item.id}
          role="status"
          className={`pointer-events-auto overflow-hidden rounded-xl shadow-[0_12px_24px_-8px_rgba(19,27,46,0.2)] ${item.tone === "success" ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container"}`}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <p className="flex-1 text-sm font-semibold leading-5">{item.message}</p>
            <button
              type="button"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-black/5"
              aria-label="Close"
              onClick={() => dismiss(item.id)}
            >
              <FiX aria-hidden className="size-4" />
            </button>
          </div>
          <div className="h-1 bg-black/10">
            <div
              className={`h-full origin-left ${item.tone === "success" ? "bg-secondary" : "bg-error"}`}
              style={{ animation: `toast-shrink ${TOAST_DURATION_MS}ms linear forwards` }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

export function FlashToast() {
  // const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const fetchFlash = async () => {
      const flash = await getFlashSession('toast');
      if (flash) {
        const flashData = JSON.parse(flash) as { status: 'success' | 'error', message: string };
        toast[flashData.status](flashData.message);
      }
    };
    fetchFlash();
  }, [pathname, searchParams]);
  return null;
}
