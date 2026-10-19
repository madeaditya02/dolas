"use client";

import { useEffect, useRef } from "react";
import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, LinearScale, Tooltip } from "chart.js";
import { formatMoney, hotspotColors } from "./format";

Chart.register(ArcElement, DoughnutController, BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export function HotspotChart({
  total,
  currency,
  categories,
}: {
  total: number;
  currency: string | null;
  categories: { category: string; amount: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const empty = categories.length === 0;
    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: empty ? ["No expenses"] : categories.map((item) => item.category),
        datasets: [{
          data: empty ? [1] : categories.map((item) => item.amount),
          backgroundColor: empty ? ["#e2e7ff"] : categories.map((_, index) => hotspotColors[index % hotspotColors.length]),
          borderWidth: 0,
        }],
      },
      options: {
        cutout: "72%",
        plugins: {
          tooltip: { enabled: !empty },
          legend: { display: false },
        },
      },
    });
    return () => chart.destroy();
  }, [categories]);

  return (
    <div className="relative mx-auto size-44">
      <canvas ref={canvasRef} />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-lg font-bold leading-6 tracking-[-0.4px] text-on-surface">{formatMoney(total, currency)}</p>
        <p className="text-[11px] font-semibold leading-[14px] text-on-surface-variant">Total Expenses</p>
      </div>
    </div>
  );
}

export function IncomeExpenseChart({
  weeks,
  currency,
}: {
  weeks: { week: string; income: number; expense: number }[];
  currency: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: weeks.map((week) => week.week),
        datasets: [
          {
            label: "Income",
            data: weeks.map((week) => week.income),
            backgroundColor: "#006c49",
            borderRadius: { topLeft: 4, topRight: 4 },
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
          {
            label: "Expense",
            data: weeks.map((week) => week.expense),
            backgroundColor: "#c0c9c0",
            borderRadius: { topLeft: 4, topRight: 4 },
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${formatMoney(Number(item.raw), currency)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#404942", font: { family: "Manrope", weight: 700, size: 11 } } },
          y: { display: false, beginAtZero: true },
        },
      },
    });
    return () => chart.destroy();
  }, [weeks, currency]);

  return (
    <div className="h-64 border-b border-surface-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
