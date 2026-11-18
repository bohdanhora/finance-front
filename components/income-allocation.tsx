"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { allocationFor } from "lib/pay-cycle";
import { roundMoney, toMoneyInput } from "lib/money";
import { formatCurrency, formatSignedCurrency, handleDecimalInputChange } from "lib/utils";
import useStore from "store/general";
import { Card, ExpectedIncome } from "types/transactions";
import { Button } from "ui/button";
import { Checkbox } from "components/ui/checkbox";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { useCardName } from "components/cards/card-face";

export const creditCardsToRepay = (cards: Card[], receivingCardId: string) => {
    const receiving = cards.find((card) => card.id === receivingCardId);
    if (receiving?.personal) return [];
    return cards.filter((card) => !card.personal && card.balance < 0 && card.id !== receivingCardId);
};

export type AllocationChoice = { payOff: boolean; save: string };

export const IncomeAllocation = ({
    income,
    amount,
    cardId,
    symbol,
    choice,
    onChange,
}: {
    income: ExpectedIncome;
    amount: number;
    cardId: string;
    symbol: string;
    choice: AllocationChoice;
    onChange: (choice: AllocationChoice) => void;
}) => {
    const t = useTranslations("expectedIncome.allocation");
    const cardName = useCardName();
    const store = useStore();

    const allocation = allocationFor(income, amount, {
        current: store.essentialsArray,
        next: store.nextMonthEssentialsArray,
        template: store.defaultEssentialsArray,
    });
    const credit = creditCardsToRepay(store.cards, cardId);
    const debt = roundMoney(credit.reduce((total, card) => total + -card.balance, 0));
    const save = Number(choice.save) || 0;
    const free = roundMoney(allocation.free - (choice.payOff ? debt : 0) - save);
    const money = (value: number) => `${formatSignedCurrency(value)} ${symbol}`;

    return (
        <div className="border-rule space-y-3 rounded-xl border p-3">
            <p className="label text-ink">{t("title")}</p>

            <div className="flex items-start justify-between gap-4 text-sm">
                <span className="min-w-0">
                    <span className="block">{t("bills", { count: allocation.bills.length })}</span>
                    {allocation.bills.length > 0 ? (
                        <span className="text-ink-faint block text-xs">
                            {allocation.bills.map((bill) => bill.title).join(", ")}
                        </span>
                    ) : (
                        <span className="text-ink-faint block text-xs">{t("noBills")}</span>
                    )}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums">−{money(allocation.billsTotal)}</span>
            </div>

            {debt > 0 && (
                <label className="flex cursor-pointer items-start justify-between gap-4 text-sm">
                    <span className="flex min-w-0 items-start gap-2.5">
                        <Checkbox
                            checked={choice.payOff}
                            onCheckedChange={(checked) => onChange({ ...choice, payOff: checked === true })}
                            className="mt-0.5"
                        />
                        <span className="min-w-0">
                            <span className="block">{t("payOff")}</span>
                            <span className="text-ink-faint block text-xs">
                                {credit.map((card) => `${cardName(card)} ${formatCurrency(-card.balance)}`).join(", ")}
                            </span>
                        </span>
                    </span>
                    <span
                        className={twMerge(
                            "shrink-0 font-mono text-xs tabular-nums",
                            !choice.payOff && "text-ink-faint line-through",
                        )}
                    >
                        −{money(debt)}
                    </span>
                </label>
            )}

            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="allocation-save">{t("save")}</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => onChange({ ...choice, save: toMoneyInput(roundMoney(amount * 0.1)) })}
                    >
                        {t("saveTenPercent")}
                    </Button>
                </div>
                <div className="relative">
                    <Input
                        id="allocation-save"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={choice.save}
                        className="pr-12 tabular-nums"
                        onChange={handleDecimalInputChange((value) => onChange({ ...choice, save: String(value) }))}
                    />
                    <span className="text-ink-faint pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                        {symbol}
                    </span>
                </div>
                <p className="text-ink-faint text-xs">{t("saveHint")}</p>
            </div>

            <div className="border-rule flex items-baseline justify-between gap-4 border-t pt-3">
                <span className="text-sm font-medium">{t("free")}</span>
                <span className={twMerge("font-mono text-sm tabular-nums", free < 0 ? "text-signal" : "text-good")}>
                    {money(free)}
                </span>
            </div>
            {free < 0 && <p className="text-signal text-xs">{t("short")}</p>}
        </div>
    );
};
