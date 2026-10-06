"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { filterByMonth, monthTotals, toMonthKey } from "lib/statistics";
import { statisticsTransactions } from "lib/cards";
import { Section } from "./wrappers/section";
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
        const scoped = statisticsTransactions(store.transactions, store.selectedCardId, store.cards);
        const thisMonth = monthTotals(filterByMonth(scoped, toMonthKey(new Date())));
        const allTime = monthTotals(scoped);

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
    }, [eurRate, store.cards, store.selectedCardId, store.transactions, usdRate]);

    const userSymbol = getCurrencySymbol(userCurrency);
    const altSymbol = getCurrencySymbol(currency);
    const showAlt = userCurrency === CURRENCY.UAH;

    const cell = (value: { default: number } & Partial<Record<CURRENCY, number>>, income: boolean) => (
        <td className="border-rule border-l px-3 py-4 text-right align-top sm:px-5">
            <span className={income ? "figure text-accent text-lg sm:text-xl" : "figure text-lg sm:text-xl"}>
                {income ? "+" : "-"}
                <AnimatedMoney value={value.default} symbol={userSymbol} symbolClassName="text-ink-faint" />
            </span>
            {showAlt && (
                <span className="text-ink-faint mt-1 block font-mono text-2xs">
                    <AnimatedMoney value={value[currency] ?? 0} symbol={altSymbol} />
                </span>
            )}
        </td>
    );

    return (
        <Section index="04" title={t("summary")}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-80 tabular-nums">
                    <thead>
                        <tr className="border-rule-strong border-b">
                            <th className="w-1/3" />
                            <th className="label border-rule border-l px-3 pb-2 text-right font-normal sm:px-5">
                                {t("totalIncome")}
                            </th>
                            <th className="label border-rule border-l px-3 pb-2 text-right font-normal sm:px-5">
                                {t("totalSpend")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(
                            [
                                { label: t("thisMonth"), values: totals.thisMonth },
                                { label: t("allTime"), values: totals.allTime },
                            ] as const
                        ).map(({ label, values }) => (
                            <tr key={label} className="border-rule border-b">
                                <th scope="row" className="py-4 pr-3 text-left align-top text-sm font-medium">
                                    {label}
                                </th>
                                {cell(values.income, true)}
                                {cell(values.spend, false)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Section>
    );
};
