"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { twMerge } from "lib/tw";
import { formatCurrency } from "lib/utils";
import { getIntlLocale } from "lib/date-locale";
import { weekdaySpending } from "lib/statistics";
import { StatCard } from "components/stat-card";
import { StatGrid } from "components/wrappers/section";
import { TransactionType } from "types/transactions";

const MONDAY = new Date(2024, 0, 1);

export const WeekdaySpending = ({
    transactions,
    currencySymbol,
}: {
    transactions: TransactionType[];
    currencySymbol: string;
}) => {
    const t = useTranslations("statistics");
    const locale = useLocale();
    const { points, weekendShare } = useMemo(() => weekdaySpending(transactions), [transactions]);
    const names = useMemo(() => {
        const format = new Intl.DateTimeFormat(getIntlLocale(locale), { weekday: "long" });
        return Array.from({ length: 7 }, (_, index) =>
            format.format(new Date(MONDAY.getFullYear(), MONDAY.getMonth(), MONDAY.getDate() + index)),
        );
    }, [locale]);

    const max = Math.max(...points.map((point) => point.value), 1);
    const top = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
    const money = (value: number) => `${formatCurrency(value)} ${currencySymbol}`;

    return (
        <div>
            <StatGrid className="lg:grid-cols-2">
                <StatCard
                    label={t("busiestWeekday")}
                    value={<span className="capitalize">{names[top.weekday]}</span>}
                    secondary={t("weekdayShare", { amount: money(top.value), percent: Math.round(top.percent) })}
                />
                <StatCard
                    label={t("weekendShare")}
                    value={`${Math.round(weekendShare)}%`}
                    secondary={t("weekendShareHint")}
                />
            </StatGrid>
            <ul className="mt-6">
                {points.map((point) => (
                    <li
                        key={point.weekday}
                        className="border-rule grid grid-cols-12 items-center gap-x-3 gap-y-2 border-b py-2.5"
                    >
                        <span
                            className={twMerge(
                                "col-span-6 text-sm capitalize sm:col-span-3",
                                point.weekday >= 5 && "text-ink-muted",
                            )}
                        >
                            {names[point.weekday]}
                        </span>
                        <span className="col-span-6 text-right font-mono text-xs tabular-nums sm:order-last sm:col-span-3">
                            {money(point.value)}
                            <span className="text-ink-faint ml-2">{t("purchases", { count: point.count })}</span>
                        </span>
                        <span className="bg-wash col-span-12 h-2 sm:col-span-6">
                            <span
                                className={twMerge(
                                    "block h-full transition-[width] duration-500",
                                    point === top ? "bg-accent" : "bg-ink-faint opacity-50",
                                )}
                                style={{ width: `${(point.value / max) * 100}%` }}
                            />
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
