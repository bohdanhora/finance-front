"use client";

import { useMemo } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    type TooltipItem,
} from "chart.js";
import { useTranslations } from "next-intl";

import { formatCurrency } from "lib/utils";
import { byCategory, byDay, byMonth, cumulativeNet, type MonthKey } from "lib/statistics";
import { TransactionType } from "types/transactions";
import { CATEGORY_COLORS, colorFor, EXPENSE_COLOR, INCOME_COLOR } from "./category-palette";

ChartJS.register(ArcElement, Tooltip, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export type ChartView = "categories" | "daily" | "months" | "trend";

/** Chart.js reads colours once, so resolve them from the live theme. */
const useAxisColors = () => {
    if (typeof window === "undefined") {
        return { grid: "rgba(120,120,120,0.15)", tick: "#8a8a8a" };
    }
    const isDark = document.documentElement.classList.contains("dark");
    return {
        grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
        tick: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
    };
};

const moneyTooltip = (symbol: string) => ({
    callbacks: {
        label: (item: TooltipItem<"bar" | "line" | "doughnut">) =>
            ` ${item.dataset.label ? item.dataset.label + ": " : ""}${formatCurrency(Number(item.parsed.y ?? item.parsed))} ${symbol}`,
    },
});

type Props = {
    view: ChartView;
    transactions: TransactionType[];
    allTransactions: TransactionType[];
    month: MonthKey;
    currencySymbol: string;
};

export const SpendingChart = ({ view, transactions, allTransactions, month, currencySymbol }: Props) => {
    const tCat = useTranslations("categories");
    const tStats = useTranslations("statistics");
    const axis = useAxisColors();

    const categories = useMemo(() => byCategory(transactions), [transactions]);
    const days = useMemo(() => byDay(transactions, month), [transactions, month]);
    const months = useMemo(() => byMonth(allTransactions, month), [allTransactions, month]);

    const scales = {
        x: { grid: { display: false }, ticks: { color: axis.tick }, border: { display: false } },
        y: {
            grid: { color: axis.grid },
            ticks: { color: axis.tick },
            border: { display: false },
            beginAtZero: true,
        },
    };

    if (view === "categories") {
        if (!categories.length) {
            return <EmptyChart message={tStats("noExpenses")} />;
        }

        return (
            <div className="flex flex-col items-center gap-8 lg:flex-row">
                <div className="w-full max-w-[280px] shrink-0">
                    <Doughnut
                        data={{
                            labels: categories.map((c) => tCat(c.name)),
                            datasets: [
                                {
                                    data: categories.map((c) => c.value),
                                    backgroundColor: categories.map((_, i) => colorFor(i)),
                                    borderWidth: 0,
                                    hoverOffset: 6,
                                },
                            ],
                        }}
                        options={{
                            cutout: "62%",
                            plugins: { legend: { display: false }, tooltip: moneyTooltip(currencySymbol) },
                        }}
                    />
                </div>

                <ul className="flex w-full flex-col gap-3">
                    {categories.map((cat, index) => (
                        <li key={cat.name} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="flex min-w-0 items-center gap-2">
                                    <span
                                        className="size-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: colorFor(index) }}
                                    />
                                    <span className="truncate">{tCat(cat.name)}</span>
                                </span>
                                <span className="text-muted-foreground shrink-0 tabular-nums">
                                    {formatCurrency(cat.value)} {currencySymbol}
                                    <span className="ml-2 text-xs">{cat.percent}%</span>
                                </span>
                            </div>
                            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                <div
                                    className="h-1.5 rounded-full transition-[width] duration-500"
                                    style={{ width: `${cat.percent}%`, backgroundColor: colorFor(index) }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (view === "daily") {
        return (
            <div className="h-[320px] w-full">
                <Bar
                    data={{
                        labels: days.map((d) => d.label),
                        datasets: [
                            {
                                label: tStats("expense"),
                                data: days.map((d) => d.expense),
                                backgroundColor: EXPENSE_COLOR,
                                borderRadius: 4,
                                maxBarThickness: 18,
                            },
                            {
                                label: tStats("income"),
                                data: days.map((d) => d.income),
                                backgroundColor: INCOME_COLOR,
                                borderRadius: 4,
                                maxBarThickness: 18,
                            },
                        ],
                    }}
                    options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: moneyTooltip(currencySymbol) },
                        scales,
                    }}
                />
            </div>
        );
    }

    if (view === "months") {
        return (
            <div className="h-[320px] w-full">
                <Bar
                    data={{
                        labels: months.map((m) => m.label),
                        datasets: [
                            {
                                label: tStats("income"),
                                data: months.map((m) => m.income),
                                backgroundColor: INCOME_COLOR,
                                borderRadius: 6,
                                maxBarThickness: 34,
                            },
                            {
                                label: tStats("expense"),
                                data: months.map((m) => m.expense),
                                backgroundColor: EXPENSE_COLOR,
                                borderRadius: 6,
                                maxBarThickness: 34,
                            },
                        ],
                    }}
                    options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: moneyTooltip(currencySymbol) },
                        scales,
                    }}
                />
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full">
            <Line
                data={{
                    labels: days.map((d) => d.label),
                    datasets: [
                        {
                            label: tStats("netFlow"),
                            data: cumulativeNet(days),
                            borderColor: "#6366f1",
                            backgroundColor: "rgba(99,102,241,0.14)",
                            fill: true,
                            tension: 0.35,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            borderWidth: 2,
                        },
                    ],
                }}
                options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: moneyTooltip(currencySymbol) },
                    scales: { ...scales, y: { ...scales.y, beginAtZero: false } },
                }}
            />
        </div>
    );
};

const EmptyChart = ({ message }: { message: string }) => (
    <div className="text-muted-foreground flex h-[240px] items-center justify-center text-sm">{message}</div>
);

export { CATEGORY_COLORS };
