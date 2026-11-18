"use client";

import useStore from "store/general";
import { useMemo } from "react";
import { formatCurrency, formatSignedCurrency } from "lib/utils";
import { safeToSpend } from "lib/pay-cycle";
import { convertSavingsCurrency } from "lib/savings";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { useExchangeRates } from "hooks/use-exchange-rates";
import { EssentialSpends } from "./dialogs/essential-spends";
import { ChangeDefaultEssentials } from "./dialogs/change-default-essentials";
import { Section, StatGrid } from "./wrappers/section";
import { StatCard } from "./stat-card";
import { AnimatedMoney } from "./animated-number";
import { EssentialsChecklist } from "./essentials-checklist";
import { ExpectedIncomeList } from "./expected-income-list";
import { PayCyclePanel } from "./pay-cycle-panel";

export const PossibleRemaining = () => {
    const t = useTranslations("possible");
    const tCycle = useTranslations("payCycle");
    const tSections = useTranslations("sections");
    const store = useStore();
    const bankStore = useBankStore();
    const exchangeRates = useExchangeRates();

    const userCurrency = store.userCurrency;
    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const rates = useMemo(() => ({ [CURRENCY.EUR]: eurRate, [CURRENCY.USD]: usdRate }), [eurRate, usdRate]);

    const savingsPlan = useMemo(
        () =>
            store.savingsGoals.reduce(
                (total, goal) =>
                    total +
                    (convertSavingsCurrency(
                        goal.monthlyContribution || 0,
                        goal.currency,
                        userCurrency,
                        exchangeRates,
                    ) ?? 0),
                0,
            ),
        [store.savingsGoals, userCurrency, exchangeRates],
    );

    const result = useMemo(
        () =>
            safeToSpend({
                balance: store.totalAmount,
                incomes: store.expectedIncomes,
                bills: {
                    current: store.essentialsArray,
                    next: store.nextMonthEssentialsArray,
                    template: store.defaultEssentialsArray,
                },
                transactions: store.transactions,
                savingsPlan,
            }),
        [
            store.totalAmount,
            store.expectedIncomes,
            store.essentialsArray,
            store.nextMonthEssentialsArray,
            store.defaultEssentialsArray,
            store.transactions,
            savingsPlan,
        ],
    );

    const currency = bankStore.currency as CURRENCY;
    const currencySymbol = getCurrencySymbol(currency);
    const userSymbol = getCurrencySymbol(userCurrency);

    const money = (value: number) => (
        <AnimatedMoney
            value={value}
            symbol={userSymbol}
            format={formatSignedCurrency}
            symbolClassName="text-ink-faint"
            className={value < 0 ? "text-signal" : undefined}
        />
    );
    const alt = (value: number) =>
        userCurrency === CURRENCY.UAH ? (
            <AnimatedMoney
                value={convertToAllCurrencies(value, rates)[currency] ?? 0}
                symbol={currencySymbol}
                format={formatSignedCurrency}
            />
        ) : undefined;

    const { cycle } = result;

    return (
        <Section title={t("thisMonth")} description={tSections("thisMonthNote")}>
            <StatGrid anchor="budget">
                <StatCard
                    label={cycle.anchored ? tCycle("untilPayday") : t("daysLeft")}
                    hint={tCycle("hintUntilPayday")}
                    value={String(cycle.daysLeft)}
                    secondary={
                        cycle.anchored ? tCycle("paydayOn", { date: cycle.end.format("DD.MM") }) : tCycle("monthEnd")
                    }
                />
                <StatCard
                    tone={result.short ? "signal" : "accent"}
                    className="bg-surface"
                    label={tCycle("available")}
                    hint={tCycle("hintAvailable")}
                    value={money(result.available)}
                    secondary={
                        result.short ? <span className="text-signal">{tCycle("short")}</span> : alt(result.available)
                    }
                />
                <StatCard
                    label={tCycle("perDay")}
                    hint={tCycle("hintPerDay")}
                    value={money(result.perDay)}
                    secondary={alt(result.perDay)}
                />
                <StatCard
                    label={tCycle("leftToday")}
                    hint={tCycle("hintLeftToday")}
                    value={money(result.leftToday)}
                    secondary={tCycle("spentToday", {
                        amount: `${formatCurrency(result.spentToday)} ${userSymbol}`,
                    })}
                />
            </StatGrid>

            <PayCyclePanel result={result} symbol={userSymbol} />

            <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-10">
                <ExpectedIncomeList />

                <div data-tour="essentials">
                    <EssentialsChecklist
                        actions={
                            <>
                                <EssentialSpends triggerLabel={t("editList")} />
                                <ChangeDefaultEssentials triggerLabel={t("template")} />
                            </>
                        }
                    />
                </div>
            </div>
        </Section>
    );
};
