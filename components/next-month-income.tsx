"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import useStore from "store/general";
import { ContentWrapper } from "./wrappers/container";
import { calculateSavings, formatCurrency } from "lib/utils";
import { CURRENCY } from "constants/index";
import ChangeNextMonthIncome from "./dialogs/change-next-month";
import NextMonthIncomeCalculate from "./dialogs/next-month-income-calculate";
import EssentialSpends from "./dialogs/essential-spends";

export default function NextMonthIncome() {
    const store = useStore();
    const bankStore = useBankStore();
    const t = useTranslations("possible");

    const [state, setState] = useState({
        totalIncome: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
        remainingIncome: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
        savedMoney: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
        savedMoneyRemaining: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
    });

    useEffect(() => {
        const eurRate = bankStore.eur?.rateBuy || 0;
        const usdRate = bankStore.usd?.rateBuy || 0;

        const totalEssentials = store.nextMonthEssentialsArray.reduce(
            (sum, item) => (!item.checked ? sum + item.amount : sum),
            0,
        );

        const totalIncome = store.nextMonthTotalAmount;
        const remainingIncome = totalIncome - totalEssentials;
        const { saved, remaining } = calculateSavings(remainingIncome);

        setState({
            totalIncome: {
                default: totalIncome,
                [CURRENCY.EUR]: eurRate ? totalIncome / eurRate : 0,
                [CURRENCY.USD]: usdRate ? totalIncome / usdRate : 0,
            },
            remainingIncome: {
                default: remainingIncome,
                [CURRENCY.EUR]: eurRate ? remainingIncome / eurRate : 0,
                [CURRENCY.USD]: usdRate ? remainingIncome / usdRate : 0,
            },
            savedMoney: {
                default: saved,
                [CURRENCY.EUR]: eurRate ? saved / eurRate : 0,
                [CURRENCY.USD]: usdRate ? saved / usdRate : 0,
            },
            savedMoneyRemaining: {
                default: remaining,
                [CURRENCY.EUR]: eurRate ? remaining / eurRate : 0,
                [CURRENCY.USD]: usdRate ? remaining / usdRate : 0,
            },
        });
    }, [store.nextMonthTotalAmount, bankStore.usd?.rateBuy, bankStore.eur?.rateBuy, store.nextMonthEssentialsArray]);

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
            <div className="flex flex-col mt-2 gap-5 justify-center flex-wrap md:flex-row">
                <EssentialSpends nextMonth />
                <ChangeNextMonthIncome />
                <NextMonthIncomeCalculate />
            </div>
            <div className="flex gap-4 flex-wrap w-full justify-between">
                {renderCard(t("totalMoneyIncome"), state.totalIncome.default, state.totalIncome[currency])}
                {renderCard(
                    t("remainingAfterEssentials"),
                    state.remainingIncome.default,
                    state.remainingIncome[currency],
                )}
                {renderCard(t("saveMoney"), state.savedMoney.default, state.savedMoney[currency])}
                {renderCard(
                    t("saveMoneyAfterPercent"),
                    state.savedMoneyRemaining.default,
                    state.savedMoneyRemaining[currency],
                )}
            </div>
        </section>
    );
}
