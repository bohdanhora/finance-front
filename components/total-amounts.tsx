"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { ContentWrapper } from "./wrappers/container";
import { formatCurrency } from "lib/utils";
import { CURRENCY } from "constants/index";

export default function TotalAmounts() {
    const store = useStore();
    const bankStore = useBankStore();
    const t = useTranslations("transactions");

    const [state, setState] = useState({
        totalIncome: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
        totalSpend: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
    });

    useEffect(() => {
        const eurRate = bankStore.eur?.rateBuy || 0;
        const usdRate = bankStore.usd?.rateBuy || 0;

        const totalIncome = store.totalIncome;
        const totalSpend = store.totalSpend;

        setState({
            totalIncome: {
                default: totalIncome,
                [CURRENCY.EUR]: eurRate ? totalIncome / eurRate : 0,
                [CURRENCY.USD]: usdRate ? totalIncome / usdRate : 0,
            },
            totalSpend: {
                default: totalSpend,
                [CURRENCY.EUR]: eurRate ? totalSpend / eurRate : 0,
                [CURRENCY.USD]: usdRate ? totalSpend / usdRate : 0,
            },
        });
    }, [store.totalIncome, store.totalSpend, bankStore.eur?.rateBuy, bankStore.usd?.rateBuy]);

    const currency = bankStore.currency as CURRENCY;
    const getCurrencySymbol = () => (currency === CURRENCY.USD ? "$" : "€");

    const renderCard = (title: string, valueUAH: number, valueCurrency: number) => (
        <ContentWrapper className="w-full sm:w-2xs">
            <span className="text-xl font-semibold">{formatCurrency(valueUAH)} ₴</span>
            <span className="text-sm">
                {formatCurrency(valueCurrency)} {getCurrencySymbol()}
            </span>
            <p className="text-base font-bold text-center mt-1">{title}</p>
        </ContentWrapper>
    );

    return (
        <section className="w-full flex flex-col items-center gap-10">
            <div className="flex gap-4 flex-wrap w-full justify-around">
                {renderCard(t("totalIncome"), state.totalIncome.default, state.totalIncome[currency])}
                {renderCard(t("totalSpend"), state.totalSpend.default, state.totalSpend[currency])}
            </div>
        </section>
    );
}
