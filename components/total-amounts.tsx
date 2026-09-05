"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { filterByMonth, monthTotals, toMonthKey } from "lib/statistics";
import { Section } from "./wrappers/section";
import { StatCard } from "./stat-card";
import { AnimatedMoney } from "./animated-number";

export const TotalAmounts = () => {
    const store = useStore();
    const bankStore = useBankStore();
    const t = useTranslations("transactions");

    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const currency = bankStore.currency as CURRENCY;

    const userCurrency = store.userCurrency;

    const totals = useMemo(() => {
        const rates = {
            [CURRENCY.EUR]: eurRate,
            [CURRENCY.USD]: usdRate,
        };
        const thisMonth = monthTotals(filterByMonth(store.transactions, toMonthKey(new Date())));
        const allTime = monthTotals(store.transactions);

        return {
            thisMonth: {
                income: convertToAllCurrencies(thisMonth.income, rates),
                spend: convertToAllCurrencies(thisMonth.expense, rates),
            },
            allTime: {
                income: convertToAllCurrencies(allTime.income, rates),
                spend: convertToAllCurrencies(allTime.expense, rates),
            },
        };
    }, [eurRate, store.transactions, usdRate]);

    const userSymbol = getCurrencySymbol(userCurrency);
    const altSymbol = getCurrencySymbol(currency);

    const money = (value: number) => <AnimatedMoney value={value} symbol={userSymbol} />;
    const alt = (value: number) =>
        userCurrency === CURRENCY.UAH ? <AnimatedMoney value={value} symbol={altSymbol} /> : undefined;

    return (
        <Section title={t("summary")}>
            <div className="space-y-6">
                {(
                    [
                        { label: t("thisMonth"), values: totals.thisMonth },
                        { label: t("allTime"), values: totals.allTime },
                    ] as const
                ).map(({ label, values }) => (
                    <div key={label}>
                        <p className="text-foreground mb-3 text-sm font-semibold">{label}</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <StatCard
                                className="min-h-[7.5rem]"
                                label={t("totalIncome")}
                                value={money(values.income.default)}
                                secondary={alt(values.income[currency])}
                            />
                            <StatCard
                                className="min-h-[7.5rem]"
                                label={t("totalSpend")}
                                value={money(values.spend.default)}
                                secondary={alt(values.spend[currency])}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
};
