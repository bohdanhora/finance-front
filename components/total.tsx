"use client";

import { AmountDelta, AnimatedMoney } from "./animated-number";
import useStore from "store/general";
import useBankStore from "store/bank";
import { CURRENCY } from "constants/index";
import { useTranslations } from "next-intl";
import { Settings2 } from "lucide-react";
import { IncomeDialogComponent } from "./dialogs/income";
import { ExpenseDialogComponent } from "./dialogs/expense";
import { SetTotalDialog } from "./dialogs/set-new-total";
import { getCurrencySymbol } from "lib/currency";
import { ALL_CARDS, balanceForFilter, findCardById, resolveCardFilter } from "lib/cards";
import { CardSwitcher } from "./cards/card-switcher";
import { CardDialog } from "./cards/card-dialog";
import { TransferDialog } from "./cards/transfer-dialog";
import { useCardName } from "./cards/card-face";
import { Button } from "./ui/button";

export const Total = () => {
    const t = useTranslations("total");
    const tCards = useTranslations("cards");

    const store = useStore();
    const bankStore = useBankStore();
    const cardName = useCardName();

    const userCurrency = store.userCurrency;
    const active = resolveCardFilter(store.selectedCardId, store.cards);
    const selectedCard = findCardById(store.cards, active) ?? (store.cards.length === 1 ? store.cards[0] : null);
    const balance = balanceForFilter(active, store.cards, store.totalAmount);
    const conversionCurrency = bankStore.currency === CURRENCY.EUR ? CURRENCY.EUR : CURRENCY.USD;
    const conversionRate = conversionCurrency === CURRENCY.EUR ? bankStore.eur?.rateBuy : bankStore.usd?.rateBuy;
    const converted = conversionRate ? balance / conversionRate : null;
    const label =
        active === ALL_CARDS && store.cards.length > 1
            ? tCards("allCards")
            : selectedCard
              ? cardName(selectedCard)
              : t("currentBalance");

    return (
        <header
            data-tour="balance"
            className="border-border bg-card relative w-full scroll-mt-24 overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -left-16 size-48 rounded-full bg-indigo-500/[0.07] blur-3xl"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="-my-1.5 flex min-h-8 items-center gap-1">
                        <p className="text-muted-foreground truncate text-[0.7rem] font-medium tracking-[0.14em] uppercase">
                            {label}
                        </p>
                        {selectedCard && <SetTotalDialog card={selectedCard} />}
                        {selectedCard && (
                            <CardDialog
                                card={selectedCard}
                                trigger={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={tCards("editTitle")}
                                        className="text-muted-foreground hover:text-foreground size-8 shrink-0"
                                    >
                                        <Settings2 className="size-4" />
                                    </Button>
                                }
                            />
                        )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h1 className="text-[2.5rem] leading-none font-semibold tracking-tight tabular-nums sm:text-5xl">
                            <AnimatedMoney
                                key={active}
                                highlight
                                value={balance}
                                symbol={getCurrencySymbol(userCurrency)}
                                symbolClassName="text-muted-foreground font-normal"
                            />
                        </h1>
                        <AmountDelta key={active} value={balance} symbol={getCurrencySymbol(userCurrency)} />
                    </div>

                    {userCurrency === CURRENCY.UAH && converted !== null && (
                        <p className="text-muted-foreground mt-2 text-sm tabular-nums">
                            <AnimatedMoney
                                prefix="≈ "
                                value={converted}
                                symbol={getCurrencySymbol(conversionCurrency)}
                            />
                        </p>
                    )}
                </div>

                <div className="grid shrink-0 auto-cols-fr grid-flow-col gap-2 sm:flex" data-tour="actions">
                    <IncomeDialogComponent />
                    <ExpenseDialogComponent />
                    <TransferDialog />
                </div>
            </div>

            <div className="relative mt-5">
                <CardSwitcher />
            </div>
        </header>
    );
};
