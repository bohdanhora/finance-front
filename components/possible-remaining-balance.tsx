"use client";

import useStore from "store/general";
import { useMemo } from "react";
import { calculateDailyBudget, formatCurrency } from "lib/utils";
import { projectRemaining, summarizeExpectedIncomes } from "lib/month-plan";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { EssentialSpends } from "./dialogs/essential-spends";
import { ChangeDefaultEssentials } from "./dialogs/change-default-essentials";
import { ExpectedIncomeDialog } from "./dialogs/expected-income";
import { Section, StatGrid } from "./wrappers/section";
import { StatCard } from "./stat-card";
import { AnimatedMoney } from "./animated-number";
import { EssentialsChecklist } from "./essentials-checklist";
import { ExpectedIncomeList } from "./expected-income-list";

export const PossibleRemaining = () => {
    const t = useTranslations("possible");
    const tHints = useTranslations("hints");
    const store = useStore();
    const bankStore = useBankStore();

    const userCurrency = store.userCurrency;

    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const rates = useMemo(() => ({ [CURRENCY.EUR]: eurRate, [CURRENCY.USD]: usdRate }), [eurRate, usdRate]);

    const {
        totalEssentials,
        dailyAfterEssentials,
        dailyBudget,
        daysLeft,
        pendingIncome,
        dailyBudgetToCurrency,
        essentialsConverted,
        essentialsDailyConverted,
    } = useMemo(() => {
        // Income still on its way counts too, otherwise a salary on the 15th
        // makes everything read zero until it arrives.
        const remainingAfterEssentials = projectRemaining(
            store.totalAmount,
            store.expectedIncomes,
            store.essentialsArray,
        );

        const { dailyBudget: dailyFull, daysLeft } = calculateDailyBudget(store.totalAmount);
        const { dailyBudget: dailyAfterEssentials } = calculateDailyBudget(remainingAfterEssentials);

        return {
            totalEssentials: remainingAfterEssentials,
            dailyAfterEssentials,
            dailyBudget: dailyFull,
            daysLeft,
            pendingIncome: summarizeExpectedIncomes(store.expectedIncomes).pending,
            dailyBudgetToCurrency: convertToAllCurrencies(dailyFull, rates),
            essentialsConverted: convertToAllCurrencies(remainingAfterEssentials, rates),
            essentialsDailyConverted: convertToAllCurrencies(dailyAfterEssentials, rates),
        };
    }, [store.totalAmount, store.essentialsArray, store.expectedIncomes, rates]);

    const currency = bankStore.currency as CURRENCY;
    const currencySymbol = getCurrencySymbol(currency);
    const userSymbol = getCurrencySymbol(userCurrency);

    const money = (value: number) => <AnimatedMoney value={value} symbol={userSymbol} />;
    const alt = (value: number) =>
        userCurrency === CURRENCY.UAH ? <AnimatedMoney value={value} symbol={currencySymbol} /> : undefined;

    const converted = alt(essentialsConverted[currency] ?? 0);
    const remainingSecondary =
        pendingIncome > 0 ? (
            <>
                {converted && <span className="block">{converted}</span>}
                <span className="mt-0.5 block text-xs text-emerald-600 dark:text-emerald-400">
                    {t("includesExpected", { amount: `${formatCurrency(pendingIncome)} ${userSymbol}` })}
                </span>
            </>
        ) : (
            converted
        );

    return (
        <Section
            title={t("thisMonth")}
            actions={
                <>
                    <ExpectedIncomeDialog />
                    <EssentialSpends />
                    <ChangeDefaultEssentials />
                </>
            }
        >
            <StatGrid>
                <StatCard label={t("daysLeft")} value={String(daysLeft)} hint={tHints("daysLeft")} />
                <StatCard
                    label={t("dailyBudget")}
                    hint={tHints("dailyBudget")}
                    value={money(dailyBudget)}
                    secondary={alt(dailyBudgetToCurrency[currency] ?? 0)}
                />
                <StatCard
                    label={t("remainingAfterEssentials")}
                    hint={tHints("remainingAfterEssentials")}
                    value={money(totalEssentials)}
                    secondary={remainingSecondary}
                />
                <StatCard
                    label={t("dailySpendingAvailable")}
                    hint={tHints("dailySpendingAvailable")}
                    value={money(dailyAfterEssentials)}
                    secondary={alt(essentialsDailyConverted[currency] ?? 0)}
                />
            </StatGrid>

            <div className="mt-3">
                <ExpectedIncomeList />
            </div>

            <div className="mt-3" data-tour="essentials">
                <EssentialsChecklist />
            </div>
        </Section>
    );
};
