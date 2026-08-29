"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";
import { Navbar } from "components/navbar";
import { OnboardingTour } from "components/onboarding/tour";
import { Section, StatGrid } from "components/wrappers/section";
import { StatCard } from "components/stat-card";
import { SpendingChart, type ChartView } from "components/charts/spending-charts";
import { ViewSwitcher } from "components/charts/view-switcher";
import { Button } from "components/ui/button";
import useStore from "store/general";
import { formatCurrency, createDateString } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";
import { filterByMonth, listMonths, monthTotals, toMonthKey } from "lib/statistics";

const StatisticsPage = () => {
    const t = useTranslations("statistics");
    const tCat = useTranslations("categories");

    const store = useStore();
    const symbol = getCurrencySymbol(store.userCurrency);

    const [month, setMonth] = useState(() => toMonthKey(new Date()));
    const [view, setView] = useState<ChartView>("categories");

    const months = useMemo(() => listMonths(store.transactions), [store.transactions]);
    const inMonth = useMemo(() => filterByMonth(store.transactions, month), [store.transactions, month]);
    const totals = useMemo(() => monthTotals(inMonth), [inMonth]);

    const topExpenses = useMemo(
        () =>
            [...inMonth]
                .filter((tx) => tx.transactionType === "expense")
                .sort((a, b) => b.value - a.value)
                .slice(0, 5),
        [inMonth],
    );

    const shiftMonth = (delta: number) => setMonth(dayjs(`${month}-01`).add(delta, "month").format("YYYY-MM"));

    const isCurrentMonth = month === toMonthKey(new Date());
    const oldest = months[months.length - 1];
    const money = (value: number) => `${formatCurrency(value)} ${symbol}`;

    const savingsRate = totals.income > 0 ? Math.round((totals.net / totals.income) * 100) : 0;

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />
                <OnboardingTour />

                <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:px-6">
                    <div className="rise-stagger flex w-full flex-col gap-10">
                        <header className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
                                <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    aria-label={t("viewMonths")}
                                    disabled={!!oldest && month <= oldest}
                                    onClick={() => shiftMonth(-1)}
                                >
                                    <ChevronLeft />
                                </Button>
                                <span className="min-w-[9.5rem] text-center text-sm font-medium">
                                    {dayjs(`${month}-01`).format("MMMM YYYY")}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    aria-label={t("viewMonths")}
                                    disabled={isCurrentMonth}
                                    onClick={() => shiftMonth(1)}
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </header>

                        <StatGrid>
                            <StatCard label={t("income")} value={money(totals.income)} />
                            <StatCard label={t("expense")} value={money(totals.expense)} />
                            <StatCard
                                label={t("net")}
                                value={`${totals.net >= 0 ? "+" : "-"}${money(Math.abs(totals.net))}`}
                                secondary={totals.income > 0 ? `${t("savingsRate")}: ${savingsRate}%` : undefined}
                            />
                            <StatCard label={t("transactions")} value={String(totals.count)} />
                        </StatGrid>

                        <Section
                            title={t("thisMonth")}
                            actions={
                                <ViewSwitcher
                                    value={view}
                                    onChange={setView}
                                    options={[
                                        { value: "categories", label: t("viewCategories") },
                                        { value: "daily", label: t("viewDaily") },
                                        { value: "months", label: t("viewMonths") },
                                        { value: "trend", label: t("viewTrend") },
                                    ]}
                                />
                            }
                        >
                            <div className="border-border bg-card w-full rounded-2xl border p-5 shadow-sm sm:p-6">
                                {inMonth.length === 0 && view !== "months" ? (
                                    <p className="text-muted-foreground py-16 text-center text-sm">{t("noData")}</p>
                                ) : (
                                    <SpendingChart
                                        view={view}
                                        transactions={inMonth}
                                        allTransactions={store.transactions}
                                        month={month}
                                        currencySymbol={symbol}
                                    />
                                )}
                            </div>
                        </Section>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <StatCard label={t("averageExpense")} value={money(totals.averageExpense)} />
                            <StatCard
                                label={t("largestExpense")}
                                value={totals.largestExpense ? money(totals.largestExpense.value) : money(0)}
                                secondary={
                                    totals.largestExpense
                                        ? totals.largestExpense.description || tCat(totals.largestExpense.categorie)
                                        : undefined
                                }
                            />
                        </div>

                        {topExpenses.length > 0 && (
                            <Section title={t("topExpenses")}>
                                <ul className="border-border bg-card divide-border divide-y rounded-2xl border shadow-sm">
                                    {topExpenses.map((tx) => (
                                        <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {tx.description || tCat(tx.categorie)}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {tCat(tx.categorie)} · {createDateString(new Date(tx.date))}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-sm font-medium tabular-nums text-rose-600 dark:text-rose-400">
                                                -{money(tx.value)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}
                    </div>
                </div>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default StatisticsPage;
