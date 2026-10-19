"use client";

import { useRouter } from "next/navigation";
import { FiCalendar, FiChevronDown } from "react-icons/fi";
import { currentMonthValue, monthLabel } from "./format";

function recentMonths() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const value = currentMonthValue(date);
    return { value, label: monthLabel(value) };
  });
}

export function MonthFilter({ month }: { month: string }) {
  const router = useRouter();
  const options = recentMonths();

  return (
    <label className="relative inline-flex items-center rounded-lg bg-surface-container-lowest px-4 py-1 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <FiCalendar aria-hidden className="size-[15px] text-on-surface" />
      <select
        aria-label="Filter bulan"
        value={month}
        className="cursor-pointer appearance-none bg-transparent py-1 pr-5 pl-2 text-[13px] font-semibold leading-4 tracking-[0.13px] text-on-surface outline-none"
        onChange={(event) => router.push(`/dashboard?month=${event.target.value}`)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FiChevronDown aria-hidden className="pointer-events-none absolute right-3 size-3 text-on-surface" />
    </label>
  );
}
