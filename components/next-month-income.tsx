"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { ContentWrapper } from "./wrappers/container";
import { formatCurrency, calculateSavings } from "lib/utils";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { CURRENCY } from "constants/index";
import ChangeNextMonthIncome from "./dialogs/change-next-month";
import NextMonthIncomeCalculate from "./dialogs/next-month-income-calculate";
import EssentialSpends from "./dialogs/essential-spends";

export default function NextMonthIncome() {
    const store = useStore();
    const bankStore = useBankStore();
    const t = useTranslations("possible");

    const currency = bankStore.currency as CURRENCY;
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
        const { saved, remaining: savedAfter } = calculateSavings(remaining);

        return {
            totalIncome: convertToAllCurrencies(total, rates),
            remainingIncome: convertToAllCurrencies(remaining, rates),
            savedMoney: convertToAllCurrencies(saved, rates),
            savedMoneyRemaining: convertToAllCurrencies(savedAfter, rates),
        };
    }, [store.nextMonthTotalAmount, store.nextMonthEssentialsArray, rates]);

    const renderCard = (title: string, valueUAH: number, valueCurrency: number) => (
        <ContentWrapper className="w-full sm:w-2xs">
            <span className="text-xl font-semibold">{formatCurrency(valueUAH)} ₴</span>
            <span className="text-sm">
                {formatCurrency(valueCurrency)} {getCurrencySymbol(currency)}
            </span>
            <p className="text-base font-bold text-center mt-1">{title}</p>
        </ContentWrapper>
    );

    return (
        <section className="w-full flex flex-col items-center gap-10">
            <div className="flex flex-col mt-2 gap-5 justify-center flex-wrap md:flex-row">
                <EssentialSpends nextMonth />
                <ChangeNextMonthIncome />
                <NextMonthIncomeCalculate />
            </div>
            <div className="flex gap-4 flex-wrap w-full justify-between">
                {renderCard(t("totalMoneyIncome"), totalIncome.default, totalIncome[currency])}
                {renderCard(t("remainingAfterEssentials"), remainingIncome.default, remainingIncome[currency])}
                {renderCard(t("saveMoney"), savedMoney.default, savedMoney[currency])}
                {renderCard(t("saveMoneyAfterPercent"), savedMoneyRemaining.default, savedMoneyRemaining[currency])}
            </div>
        </section>
    );
}
