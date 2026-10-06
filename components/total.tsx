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
import { ALL_CARDS, balanceForFilter, cardsForFilter, creditSummary, findCardById, resolveCardFilter } from "lib/cards";
import { formatCurrency, formatSignedCurrency } from "lib/utils";
import { twMerge } from "lib/tw";
import { Hint } from "./hint";
import { CardSwitcher } from "./cards/card-switcher";
import { CardDialog } from "./cards/card-dialog";
import { TransferDialog } from "./cards/transfer-dialog";
import { useCardName } from "./cards/card-face";
import { Button } from "./ui/button";

const Fact = ({
    label,
    children,
    className,
}: {
    label: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={twMerge("border-rule flex min-w-0 flex-col gap-1 border-l pl-3", className)}>
        <dt className="label flex items-center gap-1">{label}</dt>
        <dd className="font-mono text-xs tabular-nums">{children}</dd>
    </div>
);

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
    const converted = conversionRate && balance > 0 ? balance / conversionRate : null;
    const credit = creditSummary(cardsForFilter(active, store.cards));
    const symbol = getCurrencySymbol(userCurrency);
    const label =
        active === ALL_CARDS && store.cards.length > 1
            ? tCards("allCards")
            : selectedCard
              ? cardName(selectedCard)
              : t("currentBalance");

    const showConverted = userCurrency === CURRENCY.UAH && converted !== null;

    return (
        <section data-tour="balance" className="w-full scroll-mt-24">
            <div className="border-rule-strong flex items-center justify-between gap-3 border-b pb-3">
                <p className="label flex min-w-0 items-center gap-2">
                    <span className="tick" />
                    <span className="truncate">
                        {t("currentBalance")} · <span className="text-ink">{label}</span>
                    </span>
                </p>
                {selectedCard && (
                    <div className="-my-1 flex shrink-0 items-center">
                        <SetTotalDialog card={selectedCard} />
                        <CardDialog
                            card={selectedCard}
                            trigger={
                                <Button variant="ghost" size="icon-sm" aria-label={tCards("editTitle")}>
                                    <Settings2 className="size-4" />
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>

            <div className="grid gap-6 pt-6 lg:grid-cols-12 lg:items-end lg:gap-10">
                <div className="min-w-0 lg:col-span-8">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                        <h1 className={twMerge("figure text-hero min-w-0", balance < 0 && "text-signal")}>
                            <AnimatedMoney
                                key={active}
                                highlight
                                value={balance}
                                symbol={symbol}
                                symbolClassName="text-ink-faint"
                                format={formatSignedCurrency}
                            />
                        </h1>
                        <AmountDelta key={active} value={balance} symbol={symbol} className="font-mono text-xs" />
                    </div>

                    {(showConverted || credit.hasCredit) && (
                        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                            {showConverted && (
                                <Fact label={t("approx")}>
                                    <AnimatedMoney
                                        value={converted ?? 0}
                                        symbol={getCurrencySymbol(conversionCurrency)}
                                    />
                                </Fact>
                            )}
                            {credit.hasCredit && (
                                <>
                                    <Fact label={tCards("ownMoney")}>
                                        {formatCurrency(credit.own)} {symbol}
                                    </Fact>
                                    <Fact label={tCards("creditDebt")}>
                                        <span className={credit.debt > 0 ? "text-signal" : undefined}>
                                            {credit.debt > 0 ? formatSignedCurrency(-credit.debt) : formatCurrency(0)}{" "}
                                            {symbol}
                                        </span>
                                    </Fact>
                                    <Fact
                                        label={
                                            <>
                                                {tCards("creditLeft")}
                                                <Hint text={tCards("creditSplitHint")} />
                                            </>
                                        }
                                    >
                                        {formatCurrency(credit.creditLeft)} {symbol}
                                    </Fact>
                                </>
                            )}
                        </dl>
                    )}
                </div>

                <div data-tour="actions" className="grid grid-cols-2 gap-2 lg:col-span-4 lg:grid-cols-1">
                    <IncomeDialogComponent />
                    <ExpenseDialogComponent />
                    <div className="col-span-2 lg:col-span-1 empty:hidden">
                        <TransferDialog />
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <CardSwitcher />
            </div>
        </section>
    );
};
