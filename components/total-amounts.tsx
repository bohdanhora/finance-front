"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { ContentWrapper } from "./wrappers/container";
import { formatCurrency } from "lib/utils";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";

export default function TotalAmounts() {
    const store = useStore();
    const bankStore = useBankStore();
    const t = useTranslations("transactions");

    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const currency = bankStore.currency as CURRENCY;

    const { totalIncome, totalSpend } = useMemo(() => {
        const rates = {
            [CURRENCY.EUR]: eurRate,
            [CURRENCY.USD]: usdRate,
        };

        return {
            totalIncome: convertToAllCurrencies(store.totalIncome, rates),
            totalSpend: convertToAllCurrencies(store.totalSpend, rates),
        };
    }, [store.totalIncome, store.totalSpend, eurRate, usdRate]);

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
            <div className="flex gap-4 flex-wrap w-full justify-around">
                {renderCard(t("totalIncome"), totalIncome.default, totalIncome[currency])}
                {renderCard(t("totalSpend"), totalSpend.default, totalSpend[currency])}
            </div>
        </section>
    );
}
