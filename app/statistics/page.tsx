"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
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
import {
    busiestDay,
    essentialSplit,
    excludeCategories,
    expenseCategories,
    forecastPeriod,
    monthResult,
    monthTotals,
    toMonthKey,
} from "lib/statistics";
import {
    elapsedDays,
    filterByPeriod,
    granularityOf,
    isOngoing,
    periodDays,
    periodMonthKey,
    periodOf,
    shiftPeriod,
    toDateKey,
    type Period,
} from "lib/period";
import { CategoryIcon } from "components/categories/category-icon";
import { planForMonth, summarizeEssentials, summarizeExpectedIncomes } from "lib/month-plan";
import { TransactionEnum } from "constants/index";
import { ESSENTIALS_CATEGORY } from "lib/essential-category";
import { statisticsTransactions } from "lib/cards";
import { CardFilter } from "components/cards/card-filter";
import { CategoryBreakdown } from "components/charts/category-breakdown";
import { CategoryFilter } from "components/charts/category-filter";
import { PeriodPicker } from "components/charts/period-picker";
import { WeekdaySpending } from "components/charts/weekday-spending";
import { useStatisticsPreferences } from "hooks/use-statistics-preferences";

const TOP_PAGE = 5;

const StatisticsPage = () => {
    const t = useTranslations("statistics");
    const tCat = useTranslations("categories");

    const store = useStore();
    const symbol = getCurrencySymbol(store.userCurrency);
    const preferences = useStatisticsPreferences();

    const currentMonth = toMonthKey(new Date());
    const [period, setPeriodState] = useState<Period>(() => periodOf("month"));
    const [view, setView] = useState<ChartView>("categories");
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [topCount, setTopCount] = useState(TOP_PAGE);

    const setPeriod = (next: Period) => {
        setPeriodState(next);
        setSelectedDay(null);
        setTopCount(TOP_PAGE);
    };

    const scopedTransactions = useMemo(
        () => statisticsTransactions(store.transactions, store.selectedCardId, store.cards),
        [store.cards, store.selectedCardId, store.transactions],
    );
    const visibleTransactions = useMemo(
        () => excludeCategories(scopedTransactions, preferences.hidden),
        [scopedTransactions, preferences.hidden],
    );
    const earliest = useMemo(
        () =>
            scopedTransactions.reduce<string | undefined>((min, tx) => {
                const key = toDateKey(tx.date);
                return !min || key < min ? key : min;
            }, undefined),
        [scopedTransactions],
    );

    const periodTransactions = useMemo(() => filterByPeriod(scopedTransactions, period), [scopedTransactions, period]);
    const inPeriod = useMemo(() => filterByPeriod(visibleTransactions, period), [visibleTransactions, period]);
    const previousPeriod = useMemo(() => shiftPeriod(period, -1), [period]);
    const inPrevious = useMemo(
        () => filterByPeriod(visibleTransactions, previousPeriod),
        [visibleTransactions, previousPeriod],
    );

    const totals = useMemo(() => monthTotals(inPeriod), [inPeriod]);
    const result = useMemo(() => monthResult(inPeriod), [inPeriod]);
    const split = useMemo(() => essentialSplit(inPeriod), [inPeriod]);
    const previousTotals = useMemo(() => monthTotals(inPrevious), [inPrevious]);
    const busiest = useMemo(() => busiestDay(inPeriod), [inPeriod]);

    const monthKey = periodMonthKey(period);
    const plan = useMemo(
        () =>
            monthKey
                ? planForMonth(
                      monthKey,
                      currentMonth,
                      { essentials: store.essentialsArray, expectedIncomes: store.expectedIncomes },
                      store.monthHistory,
                  )
                : null,
        [currentMonth, monthKey, store.essentialsArray, store.expectedIncomes, store.monthHistory],
    );

    const ongoing = isOngoing(period);
    const totalDays = periodDays(period);
    const daysInCalculation = elapsedDays(period);
    const forecast = useMemo(() => {
        if (!ongoing || daysInCalculation === 0) return null;
        const live = monthKey === currentMonth;
        const essentials = live
            ? store.essentialsArray.filter((item) => !preferences.hidden.has(item.category ?? ESSENTIALS_CATEGORY))
            : [];
        return forecastPeriod({
            transactions: inPeriod,
            elapsed: daysInCalculation,
            total: totalDays,
            outstandingPayments: summarizeEssentials(essentials).outstanding,
            pendingIncome: live ? summarizeExpectedIncomes(store.expectedIncomes).pending : 0,
        });
    }, [
        ongoing,
        daysInCalculation,
        monthKey,
        currentMonth,
        store.essentialsArray,
        store.expectedIncomes,
        preferences.hidden,
        inPeriod,
        totalDays,
    ]);

    const expenses = useMemo(
        () => inPeriod.filter((tx) => tx.transactionType === TransactionEnum.EXPENSE).sort((a, b) => b.value - a.value),
        [inPeriod],
    );
    const topExpenses = expenses.slice(0, topCount);
    const dayTransactions = useMemo(
        () =>
            selectedDay
                ? inPeriod
                      .filter((tx) => toDateKey(tx.date) === selectedDay)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                : [],
        [inPeriod, selectedDay],
    );

    const sectionOrder = [
        "analysis",
        plan ? "plan" : null,
        "keyFigures",
        split.essential > 0 ? "essentials" : null,
        expenses.length > 0 ? "weekdays" : null,
        expenses.length > 0 ? "top" : null,
    ].filter(Boolean);
    const sectionIndex = (key: string) => String(sectionOrder.indexOf(key) + 1).padStart(2, "0");
    const essentialShare = Math.round(split.essentialShare);
    const topEssentialCategory = split.categories[0];

    const money = (value: number) => `${formatCurrency(value)} ${symbol}`;
    const animatedMoney = (value: number) => <AnimatedMoney value={value} symbol={symbol} />;
    const dailyAverage = daysInCalculation > 0 ? totals.expense / daysInCalculation : 0;
    const expenseDifference = totals.expense - previousTotals.expense;
    const expenseChange = previousTotals.expense > 0 ? (expenseDifference / previousTotals.expense) * 100 : null;
    const isMonth = period.kind === "month";

    const categoryLabel = (category: string) => getCategoryLabel(category, tCat);
    const showOnlyCategory = (category: string) =>
        preferences.showOnly(category, expenseCategories(scopedTransactions));
    const viewDescription: Record<ChartView, string> = {
        categories: t("categoriesDescription"),
        daily: granularityOf(period) === "month" ? t("monthlyDescription") : t("dailyDescription"),
        months: t("monthsDescription"),
        trend: t("trendDescription"),
    };

    const resultCard = (
        <StatCard
            label={isMonth ? t("monthResult") : t("periodResult")}
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

    const forecastCard = forecast ? (
        <StatCard
            label={isMonth ? t("forecastMonth") : t("forecastPeriod")}
            hint={t("forecastExplanation")}
            value={animatedMoney(forecast.expense)}
            secondary={
                forecast.income <= 0
                    ? t("forecastNoIncome")
                    : forecast.net >= 0
                      ? t("forecastLeft", { amount: money(forecast.net) })
                      : t("forecastShort", { amount: money(Math.abs(forecast.net)) })
            }
            tone={forecast.income > 0 && forecast.net < 0 ? "signal" : undefined}
        />
    ) : (
        <StatCard
            label={t("busiestDay")}
            value={animatedMoney(busiest?.value ?? 0)}
            secondary={busiest ? createDateString(new Date(`${busiest.date}T00:00:00`)) : undefined}
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
                                <PeriodPicker period={period} onChange={setPeriod} earliest={earliest} />
                            </>
                        }
                    />

                    <StatGrid>
                        <StatCard label={t("income")} value={animatedMoney(totals.income)} />
                        <StatCard
                            label={t("expense")}
                            value={animatedMoney(totals.expense)}
                            secondary={
                                preferences.hidden.size
                                    ? t("withoutCategories", { count: preferences.hidden.size })
                                    : undefined
                            }
                        />
                        {resultCard}
                        <StatCard
                            label={t("transactions")}
                            value={String(totals.count)}
                            secondary={t("expenseTransactions", { count: expenses.length })}
                        />
                    </StatGrid>

                    <Section
                        index="01"
                        title={t("analysisTitle")}
                        description={viewDescription[view]}
                        actions={
                            <>
                                <CategoryFilter
                                    periodTransactions={periodTransactions}
                                    hidden={preferences.hidden}
                                    onToggle={preferences.toggle}
                                    onChange={preferences.setHidden}
                                    currencySymbol={symbol}
                                />
                                <ViewSwitcher
                                    value={view}
                                    onChange={(next) => {
                                        setView(next);
                                        setSelectedDay(null);
                                    }}
                                    options={[
                                        { value: "categories", label: t("whereSpent") },
                                        {
                                            value: "daily",
                                            label:
                                                granularityOf(period) === "month"
                                                    ? t("spendingByMonth")
                                                    : t("spendingByDay"),
                                        },
                                        { value: "months", label: t("compareMonths") },
                                        { value: "trend", label: t("balanceByDay") },
                                    ]}
                                />
                            </>
                        }
                    >
                        <div className="border-rule w-full border p-4 sm:p-6">
                            {periodTransactions.length === 0 && view !== "months" ? (
                                <p className="text-ink-faint py-16 text-center text-sm">{t("noData")}</p>
                            ) : view === "categories" ? (
                                <CategoryBreakdown
                                    transactions={inPeriod}
                                    periodTransactions={periodTransactions}
                                    previousTransactions={inPrevious}
                                    historyTransactions={visibleTransactions}
                                    historyMonth={toMonthKey(period.end)}
                                    hidden={preferences.hidden}
                                    limits={preferences.limits}
                                    showLimits={isMonth}
                                    onToggle={preferences.toggle}
                                    onShowOnly={showOnlyCategory}
                                    onShowAll={preferences.showAll}
                                    onSetLimit={preferences.setLimit}
                                    currencySymbol={symbol}
                                />
                            ) : (
                                <>
                                    <SpendingChart
                                        view={view}
                                        transactions={inPeriod}
                                        allTransactions={visibleTransactions}
                                        period={period}
                                        currencySymbol={symbol}
                                        selectedKey={selectedDay}
                                        onSelectBucket={(key) =>
                                            setSelectedDay((current) => (current === key ? null : key))
                                        }
                                        onSelectMonth={(key) => setPeriod(periodOf("month", `${key}-01`))}
                                    />
                                    {selectedDay && view === "daily" && (
                                        <div className="border-rule-strong mt-6 border-t">
                                            <div className="border-rule flex items-center justify-between gap-3 border-b py-2">
                                                <span className="label">
                                                    {createDateString(new Date(`${selectedDay}T00:00:00`))} ·{" "}
                                                    {t("purchases", {
                                                        count: dayTransactions.filter(
                                                            (tx) => tx.transactionType === TransactionEnum.EXPENSE,
                                                        ).length,
                                                    })}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={t("closeDay")}
                                                    onClick={() => setSelectedDay(null)}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                            {dayTransactions.length === 0 ? (
                                                <p className="text-ink-faint py-6 text-center text-sm">
                                                    {t("nothingThatDay")}
                                                </p>
                                            ) : (
                                                <ul>
                                                    {dayTransactions.map((tx) => {
                                                        const isIncome = tx.transactionType === TransactionEnum.INCOME;
                                                        return (
                                                            <li
                                                                key={tx.id}
                                                                className="border-rule flex items-center gap-3 border-b py-2.5"
                                                            >
                                                                <span className="border-rule flex size-8 shrink-0 items-center justify-center border">
                                                                    <CategoryIcon
                                                                        category={tx.categorie}
                                                                        className="text-ink-faint size-4"
                                                                    />
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm">
                                                                        {tx.description || categoryLabel(tx.categorie)}
                                                                    </p>
                                                                    <p className="text-ink-faint mt-0.5 font-mono text-3xs uppercase">
                                                                        {categoryLabel(tx.categorie)}
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={twMerge(
                                                                        "shrink-0 font-mono text-xs tabular-nums",
                                                                        isIncome && "text-accent",
                                                                    )}
                                                                >
                                                                    {isIncome ? "+" : "-"}
                                                                    {money(tx.value)}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Section>

                    {plan && (
                        <Section index={sectionIndex("plan")} title={t("planTitle")} description={t("planDescription")}>
                            <MonthPlanSummary plan={plan} symbol={symbol} />
                        </Section>
                    )}

                    <Section index={sectionIndex("keyFigures")} title={t("keyFigures")}>
                        <StatGrid className="lg:grid-cols-3">
                            <StatCard
                                label={t("averagePurchase")}
                                value={animatedMoney(totals.averageExpense)}
                                secondary={t("averagePurchaseHint", { count: expenses.length })}
                                hint={t("averagePurchaseExplanation")}
                            />
                            <StatCard
                                label={t("medianPurchase")}
                                value={animatedMoney(totals.medianExpense)}
                                secondary={t("medianPurchaseHint")}
                                hint={t("medianPurchaseExplanation")}
                            />
                            <StatCard
                                label={t("averagePerDay")}
                                value={animatedMoney(dailyAverage)}
                                secondary={t("averagePerDayHint", { count: daysInCalculation })}
                                hint={t("averagePerDayExplanation")}
                            />
                            <StatCard
                                label={isMonth ? t("versusPreviousMonth") : t("versusPreviousPeriod")}
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
                            {forecastCard}
                        </StatGrid>
                    </Section>

                    {split.essential > 0 && (
                        <Section
                            index={sectionIndex("essentials")}
                            title={t("essentialsTitle")}
                            description={t("essentialsDescription")}
                        >
                            <div className="flex h-2 w-full gap-0.5" aria-hidden="true">
                                <span className="bg-accent h-full" style={{ width: `${split.essentialShare}%` }} />
                                <span className="bg-wash h-full flex-1" />
                            </div>
                            <StatGrid className="mt-4">
                                <StatCard
                                    tone="accent"
                                    label={t("essentialSpent")}
                                    value={animatedMoney(split.essential)}
                                    secondary={t("shareOfSpending", { percent: essentialShare })}
                                    hint={t("essentialSpentExplanation")}
                                />
                                <StatCard
                                    label={t("flexibleSpent")}
                                    value={animatedMoney(split.flexible)}
                                    secondary={t("shareOfSpending", { percent: 100 - essentialShare })}
                                />
                                <StatCard
                                    label={t("essentialPayments")}
                                    value={String(split.essentialCount)}
                                    secondary={t("essentialCategories", { count: split.categories.length })}
                                />
                                <StatCard
                                    label={t("largestEssentialCategory")}
                                    value={animatedMoney(topEssentialCategory?.value ?? 0)}
                                    secondary={
                                        topEssentialCategory ? categoryLabel(topEssentialCategory.name) : undefined
                                    }
                                />
                            </StatGrid>
                            <ol className="border-rule-strong mt-6 border-t">
                                {split.categories.map((slice) => (
                                    <li key={slice.name} className="border-rule flex items-center gap-4 border-b py-3">
                                        <span className="border-rule flex size-8 shrink-0 items-center justify-center border">
                                            <CategoryIcon category={slice.name} className="size-4" />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-sm">
                                            {categoryLabel(slice.name)}
                                        </span>
                                        <span className="text-ink-faint shrink-0 font-mono text-2xs tabular-nums">
                                            {Math.round(slice.percent)}%
                                        </span>
                                        <span className="w-32 shrink-0 text-right font-mono text-sm tabular-nums">
                                            {money(slice.value)}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </Section>
                    )}

                    {expenses.length > 0 && (
                        <Section
                            index={sectionIndex("weekdays")}
                            title={t("weekdaysTitle")}
                            description={t("weekdaysDescription")}
                        >
                            <WeekdaySpending transactions={inPeriod} currencySymbol={symbol} />
                        </Section>
                    )}

                    {expenses.length > 0 && (
                        <Section index={sectionIndex("top")} title={t("topExpenses")}>
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
                            {expenses.length > topCount && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="mt-3"
                                    onClick={() => setTopCount((count) => count + 10)}
                                >
                                    {t("showMore", { count: Math.min(10, expenses.length - topCount) })}
                                </Button>
                            )}
                        </Section>
                    )}
                </PageShell>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default StatisticsPage;
