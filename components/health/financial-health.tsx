"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { Routes } from "constants/routes";
import { creditDebtTrend, cushionOf, subscriptionsOf } from "lib/health";
import { findMainIncome } from "lib/pay-cycle";
import { getSavingsBalance } from "lib/savings";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency } from "lib/utils";
import { useExchangeRates } from "hooks/use-exchange-rates";
import useStore from "store/general";
import { Hint } from "components/hint";
import { Section } from "components/wrappers/section";

const Panel = ({
    title,
    hint,
    children,
    className,
}: {
    title: string;
    hint: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={twMerge(
            "rounded-panel border-rule bg-surface flex min-w-0 flex-col gap-3 border p-4 sm:p-5",
            className,
        )}
    >
        <p className="label flex items-center gap-1.5">
            <span className="min-w-0">{title}</span>
            <Hint text={hint} />
        </p>
        {children}
    </div>
);

export const FinancialHealth = () => {
    const t = useTranslations("health");
    const [activeBar, setActiveBar] = useState<number | null>(null);
    const store = useStore();
    const rates = useExchangeRates();
    const symbol = getCurrencySymbol(store.userCurrency);
    const money = (value: number) => `${formatCurrency(value)} ${symbol}`;

    const cushion = useMemo(
        () =>
            cushionOf({
                template: store.defaultEssentialsArray,
                current: store.essentialsArray,
                transactions: store.transactions,
                saved: getSavingsBalance(store.savingsOperations, store.userCurrency, rates) ?? 0,
            }),
        [
            store.defaultEssentialsArray,
            store.essentialsArray,
            store.transactions,
            store.savingsOperations,
            store.userCurrency,
            rates,
        ],
    );

    const debt = useMemo(
        () =>
            creditDebtTrend({
                cards: store.cards,
                transactions: store.transactions,
                payday: findMainIncome(store.expectedIncomes)?.day,
            }),
        [store.cards, store.transactions, store.expectedIncomes],
    );

    const subscriptions = useMemo(
        () =>
            subscriptionsOf({
                template: store.defaultEssentialsArray,
                current: store.essentialsArray,
                transactions: store.transactions,
            }),
        [store.defaultEssentialsArray, store.essentialsArray, store.transactions],
    );

    const cushionShare = cushion.target.max > 0 ? Math.min(cushion.saved / cushion.target.max, 1) : 0;
    const debtMax = Math.max(...debt.points.map((point) => point.debt), 1);
    const activePoint = activeBar === null ? null : debt.points[activeBar];

    return (
        <Section title={t("title")} description={t("description")}>
            <div className="grid gap-3 lg:grid-cols-3">
                <Panel title={t("cushion.title")} hint={t("cushion.hint")}>
                    {cushion.monthlyNeed <= 0 ? (
                        <p className="text-ink-faint text-sm">{t("cushion.empty")}</p>
                    ) : (
                        <>
                            <p className="figure text-figure">
                                {t("cushion.months", { months: cushion.months.toFixed(1) })}
                            </p>
                            <div className="bg-wash relative h-2 rounded-full">
                                <div
                                    className={twMerge(
                                        "h-full rounded-full",
                                        cushion.months >= 3 ? "bg-good" : cushion.months >= 1 ? "bg-warn" : "bg-signal",
                                    )}
                                    style={{ width: `${cushionShare * 100}%` }}
                                />
                                <span className="bg-ink-faint absolute -top-1 left-1/2 h-4 w-px" />
                            </div>
                            <div className="text-ink-faint flex justify-between font-mono text-2xs">
                                <span>0</span>
                                <span>{t("cushion.three", { amount: money(cushion.target.min) })}</span>
                                <span>{t("cushion.six", { amount: money(cushion.target.max) })}</span>
                            </div>
                            <p className="text-ink-muted text-xs">
                                {t("cushion.need", {
                                    amount: money(cushion.monthlyNeed),
                                    bills: money(cushion.bills),
                                    living: money(cushion.living),
                                })}
                            </p>
                            <p className={twMerge("text-sm", cushion.months >= 3 ? "text-good" : "text-ink")}>
                                {cushion.months >= 6
                                    ? t("cushion.full")
                                    : cushion.months >= 3
                                      ? t("cushion.enough")
                                      : t("cushion.missing", { amount: money(cushion.missingToMin) })}
                            </p>
                        </>
                    )}
                </Panel>

                <Panel title={t("debt.title")} hint={t("debt.hint")}>
                    {debt.status === "none" ? (
                        <p className="text-ink-faint text-sm">{t("debt.none")}</p>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-baseline gap-x-3">
                                <p
                                    className={twMerge(
                                        "figure text-figure",
                                        (activePoint ? activePoint.debt : debt.current) > 0 && "text-signal",
                                    )}
                                >
                                    {money(activePoint ? activePoint.debt : debt.current)}
                                </p>
                                {activePoint && (
                                    <span className="text-ink-faint font-mono text-xs">
                                        {t("debt.at", { date: activePoint.date.format("DD.MM") })}
                                    </span>
                                )}
                            </div>
                            <div
                                className="flex h-16 items-end gap-1.5"
                                role="group"
                                aria-label={t("debt.chart")}
                                onMouseLeave={() => setActiveBar(null)}
                            >
                                {debt.points.map((point, index) => {
                                    const last = index === debt.points.length - 1;
                                    const active = activeBar === index;
                                    return (
                                        <button
                                            type="button"
                                            key={point.date.toISOString()}
                                            aria-label={`${last ? t("debt.now") : point.date.format("DD.MM")}: ${money(point.debt)}`}
                                            className="flex h-full min-w-0 flex-1 cursor-default flex-col justify-end outline-none"
                                            onMouseEnter={() => setActiveBar(index)}
                                            onFocus={() => setActiveBar(index)}
                                            onBlur={() => setActiveBar(null)}
                                            onClick={() => setActiveBar(active ? null : index)}
                                        >
                                            <span
                                                className={twMerge(
                                                    "block w-full rounded-t-sm transition-colors",
                                                    last ? "bg-ink" : "bg-ink-faint",
                                                    active && !last && "bg-ink-muted",
                                                )}
                                                style={{ height: `${Math.max((point.debt / debtMax) * 100, 2)}%` }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="text-ink-faint flex gap-1.5 font-mono text-3xs">
                                {debt.points.map((point, index) => (
                                    <span
                                        key={point.date.toISOString()}
                                        className="min-w-0 flex-1 truncate text-center"
                                    >
                                        {index === debt.points.length - 1 ? t("debt.now") : point.date.format("DD.MM")}
                                    </span>
                                ))}
                            </div>
                            <p
                                className={twMerge(
                                    "text-sm",
                                    debt.status === "growing"
                                        ? "text-signal"
                                        : debt.status === "shrinking"
                                          ? "text-good"
                                          : "text-ink-muted",
                                )}
                            >
                                {debt.status === "growing"
                                    ? debt.growingCycles >= 2
                                        ? t("debt.growingLong", {
                                              cycles: debt.growingCycles,
                                              amount: money(debt.change),
                                          })
                                        : t("debt.growing", { amount: money(debt.change) })
                                    : debt.status === "shrinking"
                                      ? t("debt.shrinking", { amount: money(-debt.change) })
                                      : t("debt.flat")}
                            </p>
                        </>
                    )}
                </Panel>

                <Panel title={t("subscriptions.title")} hint={t("subscriptions.hint")}>
                    {subscriptions.items.length === 0 ? (
                        <p className="text-ink-faint text-sm">{t("subscriptions.empty")}</p>
                    ) : (
                        <>
                            <p className="figure text-figure">
                                {t("subscriptions.yearly", { amount: money(subscriptions.yearly) })}
                            </p>
                            <p className="text-ink-muted -mt-2 text-xs">
                                {t("subscriptions.monthly", {
                                    amount: money(subscriptions.monthly),
                                    count: subscriptions.items.length,
                                })}
                            </p>
                            <ul className="border-rule border-t text-sm">
                                {subscriptions.items.slice(0, 6).map((item) => (
                                    <li
                                        key={item.title}
                                        className="border-rule flex justify-between gap-4 border-b py-1.5"
                                    >
                                        <span className="min-w-0 truncate">{item.title}</span>
                                        <span className="text-ink-muted shrink-0 font-mono text-xs tabular-nums">
                                            {money(item.monthly * 12)}
                                            <span className="text-ink-faint">{t("subscriptions.perYear")}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-ink-muted text-xs">{t("subscriptions.advice")}</p>
                        </>
                    )}
                </Panel>
            </div>
            <p className="text-ink-faint mt-3 text-xs">
                {t("savingsLink")}{" "}
                <Link href={Routes.SAVINGS} className="text-accent underline-offset-2 hover:underline">
                    {t("savingsLinkCta")}
                </Link>
            </p>
        </Section>
    );
};
