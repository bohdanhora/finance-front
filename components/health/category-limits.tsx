"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { Routes } from "constants/routes";
import { getCategoryLabel } from "constants/categories";
import { limitsInCycle } from "lib/health";
import { PayCycle } from "lib/pay-cycle";
import { formatCurrency } from "lib/utils";
import { useStatisticsPreferences } from "hooks/use-statistics-preferences";
import { TransactionType } from "types/transactions";
import { CategoryIcon } from "components/categories/category-icon";
import { Hint } from "components/hint";

const TONE = { ok: "bg-accent", ahead: "bg-warn", over: "bg-signal" } as const;

export const CategoryLimits = ({
    cycle,
    transactions,
    symbol,
}: {
    cycle: PayCycle;
    transactions: TransactionType[];
    symbol: string;
}) => {
    const t = useTranslations("health.limits");
    const tCategories = useTranslations("categories");
    const preferences = useStatisticsPreferences();

    const progress = useMemo(
        () =>
            limitsInCycle({
                transactions,
                limits: preferences.limits,
                start: cycle.start,
                daysElapsed: cycle.daysElapsed,
                daysTotal: cycle.daysTotal,
            }),
        [transactions, preferences.limits, cycle],
    );

    return (
        <div className="rounded-panel border-rule bg-surface mt-3 border p-4 sm:p-5">
            <p className="label flex items-center gap-1.5">
                <span className="min-w-0">{t("title")}</span>
                <Hint text={t("hint")} />
            </p>
            {progress.length === 0 ? (
                <p className="text-ink-faint mt-2 text-sm">
                    {t("empty")}{" "}
                    <Link href={Routes.STATISTICS} className="text-accent underline-offset-2 hover:underline">
                        {t("setUp")}
                    </Link>
                </p>
            ) : (
                <ul className="mt-3 grid gap-x-10 gap-y-3 lg:grid-cols-2">
                    {progress.map((item) => (
                        <li key={item.category} className="min-w-0">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="flex min-w-0 items-center gap-2">
                                    <CategoryIcon category={item.category} className="text-ink-faint size-4 shrink-0" />
                                    <span className="truncate">{getCategoryLabel(item.category, tCategories)}</span>
                                </span>
                                <span className="shrink-0 font-mono text-xs tabular-nums">
                                    <span className={twMerge(item.status === "over" && "text-signal")}>
                                        {formatCurrency(item.spent)}
                                    </span>
                                    <span className="text-ink-faint">
                                        {" "}
                                        / {formatCurrency(item.limit)} {symbol}
                                    </span>
                                </span>
                            </div>
                            <div className="bg-wash relative mt-1.5 h-1.5 rounded-full">
                                <div
                                    className={twMerge("h-full rounded-full", TONE[item.status])}
                                    style={{ width: `${Math.min(item.share, 1) * 100}%` }}
                                />
                                <span
                                    className="bg-ink-faint absolute -top-0.5 h-2.5 w-px"
                                    style={{ left: `${Math.min(item.expected / item.limit, 1) * 100}%` }}
                                />
                            </div>
                            {item.status !== "ok" && (
                                <p
                                    className={twMerge(
                                        "mt-1 text-xs",
                                        item.status === "over" ? "text-signal" : "text-warn",
                                    )}
                                >
                                    {item.status === "over"
                                        ? t("over", { amount: `${formatCurrency(item.spent - item.limit)} ${symbol}` })
                                        : t("ahead", {
                                              left: `${formatCurrency(Math.max(0, item.limit - item.spent))} ${symbol}`,
                                              days: cycle.daysLeft,
                                          })}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
