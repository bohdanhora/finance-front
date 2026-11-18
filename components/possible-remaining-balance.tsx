"use client";

import useStore from "store/general";
import { useMemo } from "react";
import { formatCurrency, formatSignedCurrency } from "lib/utils";
import { safeToSpend, scopeBudget, SHARED_SCOPE } from "lib/pay-cycle";
import { findCardById, resolveCardFilter } from "lib/cards";
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
import { PayCyclePanel } from "./pay-cycle-panel";
import { useCardName } from "./cards/card-face";

export const PossibleRemaining = () => {
    const t = useTranslations("possible");
    const tCycle = useTranslations("payCycle");
    const tSections = useTranslations("sections");
    const store = useStore();
    const bankStore = useBankStore();
    const cardName = useCardName();

    const userCurrency = store.userCurrency;
    const eurRate = bankStore.eur?.rateBuy || 0;
    const usdRate = bankStore.usd?.rateBuy || 0;
    const rates = useMemo(() => ({ [CURRENCY.EUR]: eurRate, [CURRENCY.USD]: usdRate }), [eurRate, usdRate]);

    const selectedCard = findCardById(store.cards, resolveCardFilter(store.selectedCardId, store.cards));
    const personalCard = selectedCard?.personal ? selectedCard : null;

    const result = useMemo(
        () =>
            safeToSpend({
                scope: scopeBudget(
                    {
                        cards: store.cards,
                        incomes: store.expectedIncomes,
                        bills: {
                            current: store.essentialsArray,
                            next: store.nextMonthEssentialsArray,
                            template: store.defaultEssentialsArray,
                        },
                        transactions: store.transactions,
                    },
                    personalCard?.id ?? SHARED_SCOPE,
                ),
            }),
        [
            store.cards,
            store.expectedIncomes,
            store.essentialsArray,
            store.nextMonthEssentialsArray,
            store.defaultEssentialsArray,
            store.transactions,
            personalCard?.id,
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
        <Section
            title={personalCard ? tCycle("personalTitle", { card: cardName(personalCard) }) : t("thisMonth")}
            description={personalCard ? tCycle("personalNote") : tSections("thisMonthNote")}
        >
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
