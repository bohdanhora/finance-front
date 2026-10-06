"use client";

import dayjs from "dayjs";
import { useLocale, useTranslations } from "next-intl";

import { formatMonthKey } from "lib/date-locale";
import { toMonthKey } from "lib/statistics";
import { twMerge } from "lib/tw";
import { formatCurrency } from "lib/utils";
import { AnimatedMoney } from "./animated-number";
import { ChangeNextMonthIncome } from "./dialogs/change-next-month";

type Props = {
    income: number;
    essentials: number;
    saved: number;
    free: number;
    percent: number;
    symbol: string;
};

const share = (part: number, whole: number) => (whole > 0 ? Math.max(0, Math.min(100, (part / whole) * 100)) : 0);

export const NextMonthBreakdown = ({ income, essentials, saved, free, percent, symbol }: Props) => {
    const t = useTranslations("nextPlan");
    const locale = useLocale();

    const next = dayjs().add(1, "month");
    const days = next.daysInMonth();
    const month = formatMonthKey(toMonthKey(next.toDate()), locale);

    if (income <= 0) {
        return (
            <div className="border-rule flex flex-col items-start gap-4 border border-dashed p-6">
                <p className="label text-ink">{t("title", { month })}</p>
                <p className="text-ink-muted text-sm leading-relaxed">{t("empty")}</p>
                <ChangeNextMonthIncome />
            </div>
        );
    }

    const overspent = essentials > income;
    const spendable = Math.max(free, 0);
    const perDay = spendable / days;

    const segments = [
        { key: "essentials", value: Math.min(essentials, income), className: "bg-ink-faint" },
        { key: "savings", value: Math.max(saved, 0), className: "bg-accent" },
        { key: "free", value: spendable, className: "bg-ink" },
    ];

    const rows = [
        { key: "income", label: t("income"), value: income, sign: "+" },
        { key: "essentials", label: t("essentials"), value: essentials, sign: "-" },
        { key: "savings", label: t("savings", { percent }), value: Math.max(saved, 0), sign: "-" },
    ];

    return (
        <div className="lg:sticky lg:top-24">
            <div className="border-rule-strong flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
                <h3 className="label text-ink">{t("title", { month })}</h3>
                <span className="label">{t("days", { count: days })}</span>
            </div>

            <div className="mt-4 flex h-3 w-full gap-0.5" aria-hidden="true">
                {segments
                    .filter((segment) => segment.value > 0)
                    .map((segment) => (
                        <span
                            key={segment.key}
                            className={twMerge("h-full transition-[width] duration-500", segment.className)}
                            style={{ width: `${share(segment.value, income)}%` }}
                        />
                    ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {segments.map((segment) => (
                    <li key={segment.key} className="label flex items-center gap-1.5">
                        <span className={twMerge("size-2", segment.className)} />
                        {t(`legend.${segment.key}`)} {Math.round(share(segment.value, income))}%
                    </li>
                ))}
            </ul>

            <dl className="border-rule-strong mt-5 border-t">
                {rows.map((row) => (
                    <div
                        key={row.key}
                        className="border-rule flex items-baseline justify-between gap-4 border-b py-2.5"
                    >
                        <dt className="text-ink-muted text-sm">{row.label}</dt>
                        <dd className={twMerge("font-mono text-xs tabular-nums", row.sign === "+" && "text-accent")}>
                            {row.sign}
                            {formatCurrency(row.value)} {symbol}
                        </dd>
                    </div>
                ))}
                <div className="border-rule-strong flex items-baseline justify-between gap-4 border-b py-3">
                    <dt className="label text-ink">{t("free")}</dt>
                    <dd className={twMerge("figure text-figure", overspent && "text-signal")}>
                        <AnimatedMoney value={free} symbol={symbol} symbolClassName="text-ink-faint" />
                    </dd>
                </div>
            </dl>

            {overspent ? (
                <p className="border-signal text-signal mt-4 border-l-2 py-1 pl-3 text-sm">
                    {t("overspent", { amount: `${formatCurrency(essentials - income)} ${symbol}` })}
                </p>
            ) : (
                <div className="mt-4 grid grid-cols-2 gap-px">
                    <div className="border-rule border-l pl-3">
                        <p className="label">{t("perDay")}</p>
                        <p className="figure mt-1 text-lg">
                            {formatCurrency(perDay)} <span className="text-ink-faint">{symbol}</span>
                        </p>
                    </div>
                    <div className="border-rule border-l pl-3">
                        <p className="label">{t("perWeek")}</p>
                        <p className="figure mt-1 text-lg">
                            {formatCurrency(perDay * 7)} <span className="text-ink-faint">{symbol}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
