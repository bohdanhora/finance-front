"use client";

import useStore from "store/general";
import { ContentWrapper } from "./wrappers/container";
import { useMemo } from "react";
import { calculateDailyBudget, formatCurrency } from "lib/utils";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import EssentialSpends from "./dialogs/essential-spends";
import ChangeDefaultEssentials from "./dialogs/change-default-essentials";

export default function PossibleRemaining() {
    const t = useTranslations("possible");
    const store = useStore();
    const bankStore = useBankStore();

    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const rates = { [CURRENCY.EUR]: eurRate, [CURRENCY.USD]: usdRate };

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
    }, [store.totalAmount, store.essentialsArray, eurRate, usdRate]);

    const currency = bankStore.currency as CURRENCY;
    const currencySymbol = getCurrencySymbol(currency);

    const renderCard = (title: string, valueUAH: number, valueCurrency: number, currencySymbol: string) => (
        <ContentWrapper className="w-full sm:w-2xs bg-white/10 backdrop-blur-md rounded-2xl shadow-md p-4">
            <span className="text-xl font-semibold">{formatCurrency(valueUAH)} ₴</span>
            <span className="text-sm">
                {formatCurrency(valueCurrency)} {currencySymbol}
            </span>
            <p className="text-base font-bold text-center mt-1">{title}</p>
        </ContentWrapper>
    );

    return (
        <section className="w-full flex flex-col items-center gap-10">
            <div className="flex justify-center items-center gap-5 flex-wrap">
                <EssentialSpends />
                <ChangeDefaultEssentials />
            </div>
            <div className="flex gap-4 flex-wrap w-full justify-between">
                <ContentWrapper className="w-full sm:w-2xs bg-white/10 backdrop-blur-md rounded-2xl shadow-md p-4">
                    <p className="text-base font-bold text-center mt-1">{t("daysLeft")}</p>
                    <span className="text-xl font-semibold">{daysLeft}</span>
                </ContentWrapper>
                {renderCard(t("dailyBudget"), dailyBudget, dailyBudgetToCurrency[currency] ?? 0, currencySymbol)}
                {renderCard(
                    t("remainingAfterEssentials"),
                    totalEssentials,
                    essentialsConverted[currency] ?? 0,
                    currencySymbol,
                )}
                {renderCard(
                    t("dailySpendingAvailable"),
                    dailyAfterEssentials,
                    essentialsDailyConverted[currency] ?? 0,
                    currencySymbol,
                )}
            </div>
        </section>
    );
}
