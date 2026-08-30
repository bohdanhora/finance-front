"use client";

import useStore from "store/general";
import { useMemo } from "react";
import { calculateDailyBudget, formatCurrency } from "lib/utils";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { EssentialSpends } from "./dialogs/essential-spends";
import { ChangeDefaultEssentials } from "./dialogs/change-default-essentials";
import { Section, StatGrid } from "./wrappers/section";
import { StatCard } from "./stat-card";
import { EssentialsChecklist } from "./essentials-checklist";

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
        dailyBudgetToCurrency,
        essentialsConverted,
        essentialsDailyConverted,
    } = useMemo(() => {
        const totalEssentialsAmount = store.essentialsArray.reduce((sum, item) => {
            return !item.checked ? sum + item.amount : sum;
        }, 0);

        const remainingAfterEssentials = store.totalAmount - totalEssentialsAmount;

        const { dailyBudget: dailyFull, daysLeft } = calculateDailyBudget(store.totalAmount);
        const { dailyBudget: dailyAfterEssentials } = calculateDailyBudget(remainingAfterEssentials);

        return {
            totalEssentials: remainingAfterEssentials,
            dailyAfterEssentials,
            dailyBudget: dailyFull,
            daysLeft,
            dailyBudgetToCurrency: convertToAllCurrencies(dailyFull, rates),
            essentialsConverted: convertToAllCurrencies(remainingAfterEssentials, rates),
            essentialsDailyConverted: convertToAllCurrencies(dailyAfterEssentials, rates),
        };
    }, [store.totalAmount, store.essentialsArray, rates]);

    const currency = bankStore.currency as CURRENCY;
    const currencySymbol = getCurrencySymbol(currency);
    const userSymbol = getCurrencySymbol(userCurrency);

    const money = (value: number) => `${formatCurrency(value)} ${userSymbol}`;
    const alt = (value: number) =>
        userCurrency === CURRENCY.UAH ? `${formatCurrency(value)} ${currencySymbol}` : undefined;

    return (
        <Section
            title={t("thisMonth")}
            actions={
                <>
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
                    secondary={alt(essentialsConverted[currency] ?? 0)}
                />
                <StatCard
                    label={t("dailySpendingAvailable")}
                    hint={tHints("dailySpendingAvailable")}
                    value={money(dailyAfterEssentials)}
                    secondary={alt(essentialsDailyConverted[currency] ?? 0)}
                />
            </StatGrid>

            <div className="mt-3" data-tour="essentials">
                <EssentialsChecklist />
            </div>
        </Section>
    );
};
