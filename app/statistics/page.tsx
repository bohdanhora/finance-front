"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { twMerge } from "lib/tw";

import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";
import { Navbar } from "components/navbar";
import { OnboardingTour } from "components/onboarding/tour";
import { Section, StatGrid } from "components/wrappers/section";
import { PageHeader, PageShell } from "components/wrappers/page-header";
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
                    className={twMerge(result.net > 0 && "text-accent ", result.net < 0 && "text-signal ")}
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

                <PageShell>
                    <PageHeader
                        index="02"
                        title={t("title")}
                        subtitle={t("subtitle")}
                        actions={
                            <>
                                <CardFilter />
                                <div className="border-rule flex h-10 items-stretch border">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-full"
                                        aria-label={t("viewMonths")}
                                        disabled={!!oldest && month <= oldest}
                                        onClick={() => shiftMonth(-1)}
                                    >
                                        <ChevronLeft className="size-4" />
                                    </Button>
                                    <span className="border-rule flex w-40 items-center justify-center border-x font-mono text-2xs uppercase">
                                        {formatMonthKey(month, locale)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-full"
                                        aria-label={t("viewMonths")}
                                        disabled={isCurrentMonth}
                                        onClick={() => shiftMonth(1)}
                                    >
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            </>
                        }
                    />

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
                        index="01"
                        title={t("analysisTitle")}
                        description={viewDescription[view]}
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
                        <div className="border-rule w-full border p-4 sm:p-6">
                            {inMonth.length === 0 && view !== "months" ? (
                                <p className="text-ink-faint py-16 text-center text-sm">{t("noData")}</p>
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
                        <Section index="02" title={t("planTitle")} description={t("planDescription")}>
                            <MonthPlanSummary plan={plan} symbol={symbol} />
                        </Section>
                    )}

                    <Section index={plan ? "03" : "02"} title={t("keyFigures")}>
                        <StatGrid>
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
                        </StatGrid>
                    </Section>

                    {topExpenses.length > 0 && (
                        <Section index={plan ? "04" : "03"} title={t("topExpenses")}>
                            <ol className="border-rule-strong border-t">
                                {topExpenses.map((tx, index) => (
                                    <li key={tx.id} className="border-rule flex items-center gap-4 border-b py-3">
                                        <span className="text-accent w-6 shrink-0 font-mono text-2xs">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {tx.description || categoryLabel(tx.categorie)}
                                            </p>
                                            <p className="text-ink-faint mt-0.5 font-mono text-3xs uppercase">
                                                {categoryLabel(tx.categorie)} · {createDateString(new Date(tx.date))}
                                            </p>
                                        </div>
                                        <span className="shrink-0 font-mono text-sm tabular-nums">
                                            -{money(tx.value)}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </Section>
                    )}
                </PageShell>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default StatisticsPage;
