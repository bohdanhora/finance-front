"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import useStore from "store/general";
import { calculateSavings } from "lib/utils";
import { roundMoney } from "lib/money";
import { creditSummary } from "lib/cards";
import { getCurrencySymbol } from "lib/currency";
import { EssentialSpends } from "./dialogs/essential-spends";
import { ChangeNextMonthIncome } from "./dialogs/change-next-month";
import { Percentage } from "./dialogs/percentage";
import { Section } from "./wrappers/section";
import { EssentialsChecklist } from "./essentials-checklist";
import { NextMonthBreakdown } from "./next-month-breakdown";

export const NextMonthIncome = () => {
    const store = useStore();
    const t = useTranslations("possible");
    const tSections = useTranslations("sections");

    const percent = store.percentage;

    const { fromRecurring, plan } = useMemo(() => {
        const totalEssentials = store.nextMonthEssentialsArray.reduce(
            (sum, item) => (!item.checked ? sum + item.amount : sum),
            0,
        );

        const debt = creditSummary(store.cards.filter((card) => !card.personal)).debt;
        const recurring = roundMoney(
            store.expectedIncomes.filter((item) => item.recurring).reduce((sum, item) => sum + item.amount, 0),
        );
        const total = store.nextMonthTotalAmount > 0 ? store.nextMonthTotalAmount : recurring;
        const remaining = roundMoney(total - totalEssentials - debt);
        const { saved } = calculateSavings(Math.max(remaining, 0), percent);

        return {
            fromRecurring: store.nextMonthTotalAmount <= 0 && recurring > 0,
            plan: { income: total, essentials: totalEssentials, debt, saved, free: roundMoney(remaining - saved) },
        };
    }, [store.nextMonthTotalAmount, store.nextMonthEssentialsArray, store.expectedIncomes, store.cards, percent]);

    return (
        <Section
            anchor="nextMonth"
            title={t("nextMonth")}
            description={tSections("nextMonthNote")}
            actions={<ChangeNextMonthIncome />}
        >
            <div className="grid items-start gap-10 lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-7">
                    <NextMonthBreakdown
                        {...plan}
                        percent={percent}
                        symbol={getCurrencySymbol(store.userCurrency)}
                        incomeNote={fromRecurring ? t("fromRecurring") : undefined}
                        savingsAction={<Percentage />}
                    />
                </div>
                <div className="min-w-0 lg:col-span-5">
                    <EssentialsChecklist
                        nextMonth
                        actions={<EssentialSpends nextMonth triggerLabel={t("editList")} />}
                    />
                </div>
            </div>
        </Section>
    );
};
