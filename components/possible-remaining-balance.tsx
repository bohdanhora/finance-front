"use client";

import useStore from "store/general";
import { useMemo } from "react";
import { calculateDailyBudget, formatCurrency, formatSignedCurrency } from "lib/utils";
import { projectRemaining, summarizeExpectedIncomes } from "lib/month-plan";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import { CURRENCY } from "constants/index";
import { convertToAllCurrencies, getCurrencySymbol } from "lib/currency";
import { EssentialSpends } from "./dialogs/essential-spends";
import { ChangeDefaultEssentials } from "./dialogs/change-default-essentials";
import { Section, StatGrid } from "./wrappers/section";
import { StatCard } from "./stat-card";
import { AnimatedMoney } from "./animated-number";
import { EssentialsChecklist } from "./essentials-checklist";
import { ExpectedIncomeList } from "./expected-income-list";
import { ALL_CARDS, balanceForFilter, findCardById, resolveCardFilter } from "lib/cards";
import { useCardName } from "./cards/card-face";

export const PossibleRemaining = () => {
    const t = useTranslations("possible");
    const tHints = useTranslations("hints");
    const tSections = useTranslations("sections");
    const store = useStore();
    const bankStore = useBankStore();

    const cardName = useCardName();
    const userCurrency = store.userCurrency;
    const activeCard = resolveCardFilter(store.selectedCardId, store.cards);
    const selectedCard = activeCard === ALL_CARDS ? null : findCardById(store.cards, activeCard);
    const baseAmount = balanceForFilter(activeCard, store.cards, store.totalAmount);

    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const rates = useMemo(() => ({ [CURRENCY.EUR]: eurRate, [CURRENCY.USD]: usdRate }), [eurRate, usdRate]);

    const {
        totalEssentials,
        dailyAfterEssentials,
        dailyBudget,
        daysLeft,
        pendingIncome,
        dailyBudgetToCurrency,
        essentialsConverted,
        essentialsDailyConverted,
    } = useMemo(() => {
        const remainingAfterEssentials = projectRemaining(baseAmount, store.expectedIncomes, store.essentialsArray);

        const { dailyBudget: dailyFull, daysLeft } = calculateDailyBudget(baseAmount);
        const { dailyBudget: dailyAfterEssentials } = calculateDailyBudget(remainingAfterEssentials);

        return {
            totalEssentials: remainingAfterEssentials,
            dailyAfterEssentials,
            dailyBudget: dailyFull,
            daysLeft,
            pendingIncome: summarizeExpectedIncomes(store.expectedIncomes).pending,
            dailyBudgetToCurrency: convertToAllCurrencies(dailyFull, rates),
            essentialsConverted: convertToAllCurrencies(remainingAfterEssentials, rates),
            essentialsDailyConverted: convertToAllCurrencies(dailyAfterEssentials, rates),
        };
    }, [baseAmount, store.essentialsArray, store.expectedIncomes, rates]);

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
            <AnimatedMoney value={value} symbol={currencySymbol} format={formatSignedCurrency} />
        ) : undefined;

    const converted = alt(essentialsConverted[currency] ?? 0);
    const remainingSecondary =
        pendingIncome > 0 ? (
            <>
                {converted && <span className="block">{converted}</span>}
                <span className="text-accent mt-0.5 block">
                    {t("includesExpected", { amount: `${formatCurrency(pendingIncome)} ${userSymbol}` })}
                </span>
            </>
        ) : (
            converted
        );

    return (
        <Section
            index="01"
            title={
                selectedCard && store.cards.length > 1
                    ? `${t("thisMonth")} · ${cardName(selectedCard)}`
                    : t("thisMonth")
            }
            description={tSections("thisMonthNote")}
        >
            <StatGrid anchor="budget">
                <StatCard label={t("daysLeft")} value={String(daysLeft)} hint={tHints("daysLeft")} />
                <StatCard
                    label={t("dailyBudget")}
                    hint={tHints("dailyBudget")}
                    value={money(dailyBudget)}
                    secondary={alt(dailyBudgetToCurrency[currency] ?? 0)}
                />
                <StatCard
                    label={t("remainingAfterEssentials")}
                    hint={tHints("remainingAfterEssentials")}
                    value={money(totalEssentials)}
                    secondary={remainingSecondary}
                />
                <StatCard
                    tone="accent"
                    className="bg-surface"
                    label={t("dailySpendingAvailable")}
                    hint={tHints("dailySpendingAvailable")}
                    value={money(dailyAfterEssentials)}
                    secondary={alt(essentialsDailyConverted[currency] ?? 0)}
                />
            </StatGrid>

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
