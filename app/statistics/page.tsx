"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";
import { Navbar } from "components/navbar";
import { OnboardingTour } from "components/onboarding/tour";
import { Section, StatGrid } from "components/wrappers/section";
import { StatCard } from "components/stat-card";
import { AnimatedMoney } from "components/animated-number";
import { SpendingChart, type ChartView } from "components/charts/spending-charts";
import { ViewSwitcher } from "components/charts/view-switcher";
import { MonthPlanSummary } from "components/month-plan-summary";
import { Button } from "components/ui/button";
import useStore from "store/general";
import { formatCurrency, createDateString } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";
import { getCategoryLabel } from "constants/categories";
import { filterByMonth, listMonths, monthResult, monthTotals, toMonthKey } from "lib/statistics";
import { planForMonth } from "lib/month-plan";
import { TransactionEnum } from "constants/index";
import { formatMonthKey } from "lib/date-locale";
import { statisticsTransactions } from "lib/cards";
import { CardFilter } from "components/cards/card-filter";

const StatisticsPage = () => {
    const t = useTranslations("statistics");
    const tCat = useTranslations("categories");
    const locale = useLocale();

    const store = useStore();
    const symbol = getCurrencySymbol(store.userCurrency);

    const currentMonth = toMonthKey(new Date());
    const [month, setMonth] = useState(currentMonth);
    const [view, setView] = useState<ChartView>("categories");

    const scopedTransactions = useMemo(
        () => statisticsTransactions(store.transactions, store.selectedCardId, store.cards),
        [store.cards, store.selectedCardId, store.transactions],
    );
    const months = useMemo(() => listMonths(scopedTransactions), [scopedTransactions]);
    const inMonth = useMemo(() => filterByMonth(scopedTransactions, month), [scopedTransactions, month]);
    const totals = useMemo(() => monthTotals(inMonth), [inMonth]);
    const result = useMemo(() => monthResult(inMonth), [inMonth]);
    const previousMonth = dayjs(`${month}-01`).subtract(1, "month").format("YYYY-MM");
    const previousTotals = useMemo(
        () => monthTotals(filterByMonth(scopedTransactions, previousMonth)),
        [previousMonth, scopedTransactions],
    );
    const plan = useMemo(
        () =>
            planForMonth(
                month,
                currentMonth,
                { essentials: store.essentialsArray, expectedIncomes: store.expectedIncomes },
                store.monthHistory,
            ),
        [currentMonth, month, store.essentialsArray, store.expectedIncomes, store.monthHistory],
    );

    const topExpenses = useMemo(
        () =>
            [...inMonth]
                .filter((tx) => tx.transactionType === "expense")
                .sort((a, b) => b.value - a.value)
                .slice(0, 5),
        [inMonth],
    );

    const shiftMonth = (delta: number) => setMonth(dayjs(`${month}-01`).add(delta, "month").format("YYYY-MM"));

    const isCurrentMonth = month === currentMonth;
    const oldest = months[months.length - 1];
    const money = (value: number) => `${formatCurrency(value)} ${symbol}`;
    const animatedMoney = (value: number) => <AnimatedMoney value={value} symbol={symbol} />;
    const expenseCount = inMonth.filter((tx) => tx.transactionType === TransactionEnum.EXPENSE).length;
    const daysInCalculation = isCurrentMonth ? dayjs().date() : dayjs(`${month}-01`).daysInMonth();
    const dailyAverage = daysInCalculation > 0 ? totals.expense / daysInCalculation : 0;
    const expenseDifference = totals.expense - previousTotals.expense;
    const expenseChange = previousTotals.expense > 0 ? (expenseDifference / previousTotals.expense) * 100 : null;

    const categoryLabel = (category: string) => getCategoryLabel(category, tCat);
    const viewDescription: Record<ChartView, string> = {
        categories: t("categoriesDescription"),
        daily: t("dailyDescription"),
        months: t("monthsDescription"),
        trend: t("trendDescription"),
    };

    const resultCard = (
        <StatCard
            label={t("monthResult")}
            hint={t("monthResultExplanation")}
            value={
                <AnimatedMoney
                    value={Math.abs(result.net)}
                    symbol={symbol}
                    prefix={result.net > 0 ? "+" : result.net < 0 ? "-" : undefined}
                    className={twMerge(
                        result.net > 0 && "text-emerald-600 dark:text-emerald-400",
                        result.net < 0 && "text-rose-600 dark:text-rose-400",
                    )}
                />
            }
            secondary={
                <>
                    <span className="block">
                        {result.keptShare === null
                            ? t("noIncomeYet")
                            : result.kept >= 0
                              ? t("keptShare", { percent: Math.round(result.keptShare) })
                              : t("overspent", { amount: money(Math.abs(result.kept)) })}
                    </span>
                    {result.movedToSavings > 0 && (
                        <span className="block">{t("movedToSavings", { amount: money(result.movedToSavings) })}</span>
                    )}
                </>
            }
        />
    );

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

                            <div className="flex flex-wrap items-center gap-2">
                                <CardFilter />
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
                                    {formatMonthKey(month, locale)}
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
                            <StatCard label={t("income")} value={animatedMoney(totals.income)} />
                            <StatCard label={t("expense")} value={animatedMoney(totals.expense)} />
                            {resultCard}
                            <StatCard
                                label={t("transactions")}
                                value={String(totals.count)}
                                secondary={t("expenseTransactions", { count: expenseCount })}
                            />
                        </StatGrid>

                        <Section
                            title={t("analysisTitle")}
                            actions={
                                <ViewSwitcher
                                    value={view}
                                    onChange={setView}
                                    options={[
                                        { value: "categories", label: t("whereSpent") },
                                        { value: "daily", label: t("spendingByDay") },
                                        { value: "months", label: t("compareMonths") },
                                        { value: "trend", label: t("balanceByDay") },
                                    ]}
                                />
                            }
                        >
                            <div className="border-border bg-card w-full rounded-2xl border p-5 shadow-sm sm:p-6">
                                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">{viewDescription[view]}</p>
                                {inMonth.length === 0 && view !== "months" ? (
                                    <p className="text-muted-foreground py-16 text-center text-sm">{t("noData")}</p>
                                ) : (
                                    <SpendingChart
                                        view={view}
                                        transactions={inMonth}
                                        allTransactions={scopedTransactions}
                                        month={month}
                                        currencySymbol={symbol}
                                    />
                                )}
                            </div>
                        </Section>

                        {plan && (
                            <Section title={t("planTitle")}>
                                <p className="text-muted-foreground -mt-2 mb-4 max-w-2xl text-sm">
                                    {t("planDescription")}
                                </p>
                                <MonthPlanSummary plan={plan} symbol={symbol} />
                            </Section>
                        )}

                        <Section title={t("keyFigures")}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <StatCard
                                    label={t("averagePurchase")}
                                    value={animatedMoney(totals.averageExpense)}
                                    secondary={t("averagePurchaseHint", { count: expenseCount })}
                                    hint={t("averagePurchaseExplanation")}
                                />
                                <StatCard
                                    label={t("averagePerDay")}
                                    value={animatedMoney(dailyAverage)}
                                    secondary={t("averagePerDayHint", { count: daysInCalculation })}
                                    hint={t("averagePerDayExplanation")}
                                />
                                <StatCard
                                    label={t("versusPreviousMonth")}
                                    value={
                                        expenseChange === null
                                            ? "-"
                                            : `${expenseChange >= 0 ? "+" : ""}${Math.round(expenseChange)}%`
                                    }
                                    secondary={
                                        expenseChange === null
                                            ? t("noPreviousMonthData")
                                            : expenseDifference > 0
                                              ? t("spentMore", { amount: money(Math.abs(expenseDifference)) })
                                              : expenseDifference < 0
                                                ? t("spentLess", { amount: money(Math.abs(expenseDifference)) })
                                                : t("spentSame")
                                    }
                                    hint={t("versusPreviousMonthExplanation")}
                                />
                                <StatCard
                                    label={t("largestExpense")}
                                    value={animatedMoney(totals.largestExpense ? totals.largestExpense.value : 0)}
                                    secondary={
                                        totals.largestExpense
                                            ? totals.largestExpense.description ||
                                              categoryLabel(totals.largestExpense.categorie)
                                            : undefined
                                    }
                                />
                            </div>
                        </Section>

                        {topExpenses.length > 0 && (
                            <Section title={t("topExpenses")}>
                                <ul className="border-border bg-card divide-border divide-y rounded-2xl border shadow-sm">
                                    {topExpenses.map((tx) => (
                                        <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {tx.description || categoryLabel(tx.categorie)}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {categoryLabel(tx.categorie)} ·{" "}
                                                    {createDateString(new Date(tx.date))}
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
