import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-container-high bg-surface-container-low px-4 py-8 sm:px-8">
      <div className="flex items-center justify-center gap-2">
        <Image src="/dolas-logo.png" alt="" width={24} height={24} className="size-6" />
        <p className="text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface-variant">
          © 2026 Dolas Finance. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
