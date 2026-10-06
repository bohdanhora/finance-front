"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    Tooltip,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    type TooltipItem,
} from "chart.js";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { formatCurrency } from "lib/utils";
import { byCategory, byDay, byMonth, cumulativeNet, type MonthKey } from "lib/statistics";
import { TransactionType } from "types/transactions";
import { getCategoryLabel } from "constants/categories";
import { formatMonthKey } from "lib/date-locale";
import { CategoryIcon } from "components/categories/category-icon";

ChartJS.register(Tooltip, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export type ChartView = "categories" | "daily" | "months" | "trend";

type Palette = {
    accent: string;
    accentWash: string;
    muted: string;
    rule: string;
    tick: string;
    paper: string;
    ink: string;
};

const FALLBACK: Palette = {
    accent: "#2531e0",
    accentWash: "#e3e5fb",
    muted: "#868a90",
    rule: "#cdd0d1",
    tick: "#64686e",
    paper: "#f0f1ee",
    ink: "#0c0d0e",
};

const usePalette = () => {
    const { resolvedTheme } = useTheme();
    const [palette, setPalette] = useState<Palette>(FALLBACK);

    useEffect(() => {
        const style = getComputedStyle(document.documentElement);
        const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
        const dark = document.documentElement.classList.contains("dark");
        setPalette({
            accent: read("--accent", FALLBACK.accent),
            accentWash: read("--accent-wash", FALLBACK.accentWash),
            muted: dark ? "#6e727a" : FALLBACK.muted,
            rule: read("--rule", FALLBACK.rule),
            tick: read("--ink-faint", FALLBACK.tick),
            paper: read("--paper", FALLBACK.paper),
            ink: read("--ink", FALLBACK.ink),
        });
    }, [resolvedTheme]);

    return palette;
};

const Legend = ({ items }: { items: { label: string; color: string }[] }) => (
    <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item) => (
            <li key={item.label} className="label flex items-center gap-2">
                <span className="size-2.5" style={{ backgroundColor: item.color }} />
                {item.label}
            </li>
        ))}
    </ul>
);

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
    const locale = useLocale();
    const palette = usePalette();
    const categoryLabel = (category: string) => getCategoryLabel(category, tCat);

    const categories = useMemo(() => byCategory(transactions), [transactions]);
    const days = useMemo(() => byDay(transactions, month), [transactions, month]);
    const months = useMemo(() => byMonth(allTransactions, month), [allTransactions, month]);

    const font = { family: "Martian Mono, IBM Plex Sans, monospace", size: 10 };

    const tooltip = {
        backgroundColor: palette.paper,
        titleColor: palette.ink,
        bodyColor: palette.ink,
        borderColor: palette.ink,
        borderWidth: 1,
        cornerRadius: 0,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        titleFont: font,
        bodyFont: { ...font, size: 11 },
        callbacks: {
            label: (item: TooltipItem<"bar" | "line">) =>
                ` ${item.dataset.label ? item.dataset.label + ": " : ""}${formatCurrency(Number(item.parsed.y))} ${currencySymbol}`,
        },
    };

    const scales = {
        x: { grid: { display: false }, ticks: { color: palette.tick, font }, border: { color: palette.ink } },
        y: {
            grid: { color: palette.rule },
            ticks: { color: palette.tick, font },
            border: { display: false },
            beginAtZero: true,
        },
    };

    const options = {
        maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        plugins: { legend: { display: false }, tooltip },
        scales,
    };

    if (view === "categories") {
        if (!categories.length) {
            return <EmptyChart message={tStats("noExpenses")} />;
        }

        const total = categories.reduce((sum, category) => sum + category.value, 0);
        const max = categories[0]?.value || 1;

        return (
            <div>
                <div className="border-rule-strong flex flex-wrap items-baseline justify-between gap-3 border-b pb-3">
                    <span className="label">{tStats("expense")}</span>
                    <span className="figure text-figure">
                        {formatCurrency(total)} <span className="text-ink-faint">{currencySymbol}</span>
                    </span>
                </div>
                <ul>
                    {categories.map((cat) => (
                        <li
                            key={cat.name}
                            className="border-rule grid grid-cols-12 items-center gap-x-3 gap-y-2 border-b py-3"
                        >
                            <span className="col-span-7 flex min-w-0 items-center gap-2.5 text-sm sm:col-span-4">
                                <CategoryIcon category={cat.name} className="text-ink-faint size-4 shrink-0" />
                                <span className="break-words">{categoryLabel(cat.name)}</span>
                            </span>
                            <span className="col-span-5 text-right font-mono text-xs tabular-nums sm:order-last sm:col-span-3">
                                {formatCurrency(cat.value)} {currencySymbol}
                                <span className="text-ink-faint ml-2">{cat.percent}%</span>
                            </span>
                            <span className="bg-wash col-span-12 h-2 sm:col-span-5">
                                <span
                                    className="bg-accent block h-full transition-[width] duration-500"
                                    style={{ width: `${(cat.value / max) * 100}%` }}
                                />
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    const pairLegend = [
        { label: tStats("income"), color: palette.accent },
        { label: tStats("expense"), color: palette.muted },
    ];

    if (view === "daily" || view === "months") {
        const source =
            view === "daily"
                ? days.map((d) => ({ label: d.label, income: d.income, expense: d.expense }))
                : months.map((m) => ({
                      label: formatMonthKey(m.month, locale, "short"),
                      income: m.income,
                      expense: m.expense,
                  }));

        return (
            <div>
                <Legend items={pairLegend} />
                <div className="h-80 w-full">
                    <Bar
                        data={{
                            labels: source.map((item) => item.label),
                            datasets: [
                                {
                                    label: tStats("income"),
                                    data: source.map((item) => item.income),
                                    backgroundColor: palette.accent,
                                    borderRadius: 0,
                                    maxBarThickness: view === "daily" ? 14 : 32,
                                    categoryPercentage: 0.7,
                                    barPercentage: 0.9,
                                },
                                {
                                    label: tStats("expense"),
                                    data: source.map((item) => item.expense),
                                    backgroundColor: palette.muted,
                                    borderRadius: 0,
                                    maxBarThickness: view === "daily" ? 14 : 32,
                                    categoryPercentage: 0.7,
                                    barPercentage: 0.9,
                                },
                            ],
                        }}
                        options={options}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-80 w-full">
            <Line
                data={{
                    labels: days.map((d) => d.label),
                    datasets: [
                        {
                            label: tStats("netFlow"),
                            data: cumulativeNet(days),
                            borderColor: palette.accent,
                            backgroundColor: palette.accentWash,
                            fill: true,
                            tension: 0,
                            stepped: false,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            pointHoverBackgroundColor: palette.accent,
                            pointHoverBorderColor: palette.paper,
                            pointHoverBorderWidth: 2,
                            borderWidth: 2,
                        },
                    ],
                }}
                options={{ ...options, scales: { ...scales, y: { ...scales.y, beginAtZero: false } } }}
            />
        </div>
    );
};

const EmptyChart = ({ message }: { message: string }) => (
    <div className="text-ink-faint flex h-60 items-center justify-center text-sm">{message}</div>
);
