"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { formatCurrency } from "lib/utils";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { Section } from "./wrappers/section";
import { StatCard } from "./stat-card";

export const TotalAmounts = () => {
    const store = useStore();
    const bankStore = useBankStore();
    const t = useTranslations("transactions");

    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const currency = bankStore.currency as CURRENCY;

    const userCurrency = store.userCurrency;

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

    const userSymbol = getCurrencySymbol(userCurrency);
    const altSymbol = getCurrencySymbol(currency);

    const money = (value: number) => `${formatCurrency(value)} ${userSymbol}`;
    const alt = (value: number) =>
        userCurrency === CURRENCY.UAH ? `${formatCurrency(value)} ${altSymbol}` : undefined;

    return (
        <Section title={t("summary")}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard
                    label={t("totalIncome")}
                    value={money(totalIncome.default)}
                    secondary={alt(totalIncome[currency])}
                />
                <StatCard
                    label={t("totalSpend")}
                    value={money(totalSpend.default)}
                    secondary={alt(totalSpend[currency])}
                />
            </div>
        </Section>
    );
};
