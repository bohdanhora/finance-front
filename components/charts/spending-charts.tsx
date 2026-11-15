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
    type ActiveElement,
    type ChartEvent,
    type TooltipItem,
} from "chart.js";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { formatCurrency } from "lib/utils";
import { byMonth, cumulativeNet, type MonthKey } from "lib/statistics";
import { byBucket, granularityOf, type Granularity, type Period } from "lib/period";
import { TransactionType } from "types/transactions";
import { formatMonthKey } from "lib/date-locale";

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
    accent: "#35e0c8",
    accentWash: "#0c2a27",
    muted: "#3a4448",
    rule: "#1a1f23",
    tick: "#7a868d",
    paper: "#0d1012",
    ink: "#f2f5f4",
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
            muted: dark ? "#3a4448" : "#c3ccca",
            rule: read("--rule", FALLBACK.rule),
            tick: read("--ink-faint", FALLBACK.tick),
            paper: read("--surface", FALLBACK.paper),
            ink: read("--ink", FALLBACK.ink),
        });
    }, [resolvedTheme]);

    return palette;
};

const Legend = ({ items }: { items: { label: string; color: string }[] }) => (
    <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item) => (
            <li key={item.label} className="label flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
            </li>
        ))}
    </ul>
);

type Props = {
    view: ChartView;
    transactions: TransactionType[];
    allTransactions: TransactionType[];
    period: Period;
    currencySymbol: string;
    selectedKey?: string | null;
    onSelectBucket?: (key: string) => void;
    onSelectMonth?: (month: MonthKey) => void;
};

type Point = { key: string; label: string; income: number; expense: number };

const pointerOnHover = (event: ChartEvent, elements: ActiveElement[]) => {
    const target = event.native?.target as HTMLElement | undefined;
    if (target) target.style.cursor = elements.length ? "pointer" : "default";
};

const bucketLabel = (key: string, granularity: Granularity, singleMonth: boolean, locale: string) => {
    if (granularity === "month") return formatMonthKey(key, locale, "short");
    if (singleMonth) return String(Number(key.slice(8)));
    return `${key.slice(8)}.${key.slice(5, 7)}`;
};

export const SpendingChart = ({
    view,
    transactions,
    allTransactions,
    period,
    currencySymbol,
    selectedKey,
    onSelectBucket,
    onSelectMonth,
}: Props) => {
    const tStats = useTranslations("statistics");
    const locale = useLocale();
    const palette = usePalette();

    const granularity = granularityOf(period);
    const singleMonth = period.start.slice(0, 7) === period.end.slice(0, 7);
    const buckets = useMemo<Point[]>(
        () =>
            byBucket(transactions, period).map((point) => ({
                ...point,
                label: bucketLabel(point.key, granularity, singleMonth, locale),
            })),
        [transactions, period, granularity, singleMonth, locale],
    );
    const months = useMemo<Point[]>(
        () =>
            byMonth(allTransactions, period.end.slice(0, 7), period.kind === "year" ? 12 : 6).map((point) => ({
                key: point.month,
                label: formatMonthKey(point.month, locale, "short"),
                income: point.income,
                expense: point.expense,
            })),
        [allTransactions, period.end, period.kind, locale],
    );

    const monoFamily =
        typeof document === "undefined"
            ? ""
            : getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim();
    const font = { family: monoFamily ? `${monoFamily}, monospace` : "monospace", size: 10 };

    const tooltip = {
        backgroundColor: palette.paper,
        titleColor: palette.ink,
        bodyColor: palette.ink,
        borderColor: palette.rule,
        borderWidth: 1,
        cornerRadius: 10,
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
        x: { grid: { display: false }, ticks: { color: palette.tick, font }, border: { color: palette.rule } },
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

    const pairLegend = [
        { label: tStats("income"), color: palette.accent },
        { label: tStats("expense"), color: palette.muted },
    ];

    if (view === "daily" || view === "months") {
        const source = view === "daily" ? buckets : months;
        const opensMonth = view === "months" || granularity === "month";
        const select = (index: number) => {
            const point = source[index];
            if (!point) return;
            if (opensMonth) onSelectMonth?.(point.key);
            else onSelectBucket?.(point.key);
        };
        const colorFor = (base: string) => source.map((point) => (point.key === selectedKey ? palette.ink : base));
        const thin = view === "daily" && granularity === "day";

        return (
            <div>
                <div className="flex flex-wrap items-start justify-between gap-x-3">
                    <Legend items={pairLegend} />
                    <p className="text-ink-faint mb-4 text-xs">
                        {opensMonth ? tStats("clickMonthHint") : tStats("clickDayHint")}
                    </p>
                </div>
                <div className="h-80 w-full">
                    <Bar
                        data={{
                            labels: source.map((item) => item.label),
                            datasets: [
                                {
                                    label: tStats("income"),
                                    data: source.map((item) => item.income),
                                    backgroundColor: colorFor(palette.accent),
                                    borderRadius: 6,
                                    maxBarThickness: thin ? 14 : 32,
                                    categoryPercentage: 0.7,
                                    barPercentage: 0.9,
                                },
                                {
                                    label: tStats("expense"),
                                    data: source.map((item) => item.expense),
                                    backgroundColor: colorFor(palette.muted),
                                    borderRadius: 6,
                                    maxBarThickness: thin ? 14 : 32,
                                    categoryPercentage: 0.7,
                                    barPercentage: 0.9,
                                },
                            ],
                        }}
                        options={{
                            ...options,
                            onHover: pointerOnHover,
                            onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
                                if (elements[0]) select(elements[0].index);
                            },
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-80 w-full">
            <Line
                data={{
                    labels: buckets.map((point) => point.label),
                    datasets: [
                        {
                            label: tStats("netFlow"),
                            data: cumulativeNet(buckets),
                            borderColor: palette.accent,
                            backgroundColor: palette.accentWash,
                            fill: true,
                            tension: 0.35,
                            cubicInterpolationMode: "monotone",
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
