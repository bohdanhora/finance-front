"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { formatCurrency, calculateSavings } from "lib/utils";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { CURRENCY } from "constants/index";
import { EssentialSpends } from "./dialogs/essential-spends";
import { ChangeNextMonthIncome } from "./dialogs/change-next-month";
import { NextMonthIncomeCalculate } from "./dialogs/next-month-income-calculate";
import { Percentage } from "./dialogs/percentage";
import { Section, StatGrid } from "./wrappers/section";
import { StatCard } from "./stat-card";
import { EssentialsChecklist } from "./essentials-checklist";

export const NextMonthIncome = () => {
    const store = useStore();
    const bankStore = useBankStore();
    const t = useTranslations("possible");
    const tHints = useTranslations("hints");

    const currency = bankStore.currency as CURRENCY;
    const percent = store.percentage;
    const userCurrency = store.userCurrency;

    const rates = {
        [CURRENCY.EUR]: bankStore.eur?.rateBuy || 0,
        [CURRENCY.USD]: bankStore.usd?.rateBuy || 0,
    };

    const { totalIncome, remainingIncome, savedMoney, savedMoneyRemaining } = useMemo(() => {
        const totalEssentials = store.nextMonthEssentialsArray.reduce(
            (sum, item) => (!item.checked ? sum + item.amount : sum),
            0,
        );

        const total = store.nextMonthTotalAmount;
        const remaining = total - totalEssentials;
        const { saved, remaining: savedAfter } = calculateSavings(remaining, percent);

        return {
            totalIncome: convertToAllCurrencies(total, rates),
            remainingIncome: convertToAllCurrencies(remaining, rates),
            savedMoney: convertToAllCurrencies(saved, rates),
            savedMoneyRemaining: convertToAllCurrencies(savedAfter, rates),
        };
    }, [store.nextMonthTotalAmount, store.nextMonthEssentialsArray, rates]);

    const userSymbol = getCurrencySymbol(userCurrency);
    const altSymbol = getCurrencySymbol(currency);

    const money = (value: number) => `${formatCurrency(value)} ${userSymbol}`;
    const alt = (value: number) =>
        userCurrency === CURRENCY.UAH ? `${formatCurrency(value)} ${altSymbol}` : undefined;

    return (
        <Section
            anchor="nextMonth"
            className="scroll-mt-24"
            title={t("nextMonth")}
            actions={
                <>
                    <EssentialSpends nextMonth />
                    <ChangeNextMonthIncome />
                    <NextMonthIncomeCalculate />
                </>
            }
        >
            <StatGrid>
                <StatCard
                    label={t("totalMoneyIncome")}
                    hint={tHints("totalMoneyIncome")}
                    value={money(totalIncome.default)}
                    secondary={alt(totalIncome[currency])}
                />
                <StatCard
                    label={t("remainingAfterEssentials")}
                    hint={tHints("nextRemainingAfterEssentials")}
                    value={money(remainingIncome.default)}
                    secondary={alt(remainingIncome[currency])}
                />
                <StatCard
                    label={t("saveMoney", { percentage: percent })}
                    hint={tHints("saveMoney")}
                    value={money(savedMoney.default)}
                    secondary={alt(savedMoney[currency])}
                    action={<Percentage />}
                />
                <StatCard
                    label={t("saveMoneyAfterPercent")}
                    hint={tHints("saveMoneyAfterPercent")}
                    value={money(savedMoneyRemaining.default)}
                    secondary={alt(savedMoneyRemaining[currency])}
                />
            </StatGrid>

            <div className="mt-3">
                <EssentialsChecklist nextMonth />
            </div>
        </Section>
    );
};
