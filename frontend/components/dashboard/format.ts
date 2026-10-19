export const hotspotColors = ["#006c49", "#2e2dbe", "#f59e0b", "#8b5cf6", "#e11d48", "#707971"];

export function formatMoney(amount: number, currency: string | null) {
  const raw = currency?.trim() || "IDR";
  const [maybeLocale, maybeCode] = raw.split(" ");
  const code = maybeCode || raw;
  const locale = maybeCode ? maybeLocale : code === "IDR" ? "id-ID" : "en-US";
  const digits = code === "IDR" ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function currentMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isMonthValue(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}

export function monthLabel(value: string, month: "long" | "short" = "long") {
  const [year, monthNumber] = value.split("-").map(Number);
  return new Date(year || 2026, (monthNumber || 1) - 1, 1).toLocaleDateString("en-US", {
    month,
    year: "numeric",
  });
}
