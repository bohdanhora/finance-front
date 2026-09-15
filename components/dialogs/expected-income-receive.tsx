"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { useSetExpectedIncomeReceived } from "api/main";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { roundMoney, toMoneyInput } from "lib/money";
import useStore from "store/general";
import { ExpectedIncome } from "types/transactions";
import { Button } from "ui/button";
import { Checkbox } from "components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "ui/dialog";
import { Input } from "ui/input";
import { Label } from "ui/label";

type Props = {
    income: ExpectedIncome | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const ExpectedIncomeReceiveDialog = ({ income, open, onOpenChange }: Props) => {
    const t = useTranslations("expectedIncome.receive");
    const store = useStore();
    const { mutateAsync: setReceived, isPending } = useSetExpectedIncomeReceived();
    const [actualAmount, setActualAmount] = useState("");
    const [addToBalance, setAddToBalance] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isUndo = Boolean(income?.received);
    const symbol = getCurrencySymbol(store.userCurrency);
    const numericAmount = Number(actualAmount);
    const hasValidAmount = actualAmount.length > 0 && Number.isFinite(numericAmount) && numericAmount > 0;

    useEffect(() => {
        if (!open || !income) return;
        setActualAmount(toMoneyInput(income.receivedAmount ?? income.amount));
        setAddToBalance(true);
        setError(null);
    }, [income, open]);

    const submit = async () => {
        if (!income) return;

        if (!isUndo && !hasValidAmount) {
            setError(t("invalidAmount"));
            return;
        }

        setError(null);
        try {
            const response = await setReceived({
                id: income.id,
                received: !isUndo,
                ...(!isUndo && { actualAmount: roundMoney(numericAmount), addToBalance }),
            });

            store.setExpectedIncomes(response.updatedItems);
            store.setTotalAmount(response.updatedTotals.totalAmount);
            store.setTotalIncome(response.updatedTotals.totalIncome);
            store.setTotalSpend(response.updatedTotals.totalSpend);
            store.setTransactions(response.updatedTransactions);

            toast.success(
                isUndo ? t("undoSuccess") : t("success", { amount: formatCurrency(numericAmount), currency: symbol }),
            );
            onOpenChange(false);
        } catch {}
    };

    if (!income) return null;

    const receivedAmount = income.receivedAmount ?? income.amount;
    const difference = hasValidAmount ? roundMoney(numericAmount - income.amount) : 0;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isUndo ? t("undoTitle") : t("title", { title: income.title })}</DialogTitle>
                    <DialogDescription>
                        {isUndo
                            ? income.transactionId
                                ? t("undoDescription", { amount: formatCurrency(receivedAmount), currency: symbol })
                                : t("undoDescriptionNoBalance")
                            : t("description")}
                    </DialogDescription>
                </DialogHeader>

                {!isUndo && (
                    <div className="space-y-4">
                        <div className="border-border bg-muted/30 flex items-center justify-between gap-4 rounded-xl border p-4">
                            <span className="text-muted-foreground text-sm">{t("planned")}</span>
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(income.amount)} {symbol}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor={"expected-income-" + income.id}>{t("actualAmount")}</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-auto px-2 py-1 text-xs"
                                    onClick={() => {
                                        setActualAmount(toMoneyInput(income.amount));
                                        setError(null);
                                    }}
                                >
                                    {t("usePlanned")}
                                </Button>
                            </div>
                            <div className="relative">
                                <Input
                                    id={"expected-income-" + income.id}
                                    value={actualAmount}
                                    inputMode="decimal"
                                    autoFocus
                                    aria-invalid={Boolean(error)}
                                    className="pr-12 text-lg font-medium tabular-nums"
                                    onChange={handleDecimalInputChange((value) => {
                                        setActualAmount(String(value));
                                        setError(null);
                                    })}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            void submit();
                                        }
                                    }}
                                />
                                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                                    {symbol}
                                </span>
                            </div>
                            {error && <p className="text-destructive text-sm">{error}</p>}
                        </div>

                        <label className="border-border/70 flex cursor-pointer items-start gap-3 rounded-xl border p-3">
                            <Checkbox
                                checked={addToBalance}
                                onCheckedChange={(checked) => setAddToBalance(checked === true)}
                                className="mt-0.5"
                            />
                            <span className="space-y-1">
                                <span className="block text-sm font-medium">{t("addToBalance")}</span>
                                <span className="text-muted-foreground block text-xs">{t("addToBalanceHint")}</span>
                            </span>
                        </label>

                        {hasValidAmount && (
                            <div className="space-y-1 text-sm">
                                {difference < 0 && (
                                    <p className="text-amber-600 dark:text-amber-400">
                                        {t("lessThanPlanned", {
                                            amount: formatCurrency(Math.abs(difference)),
                                            currency: symbol,
                                        })}
                                    </p>
                                )}
                                {difference > 0 && (
                                    <p className="text-emerald-600 dark:text-emerald-400">
                                        {t("moreThanPlanned", { amount: formatCurrency(difference), currency: symbol })}
                                    </p>
                                )}
                                {addToBalance && (
                                    <p className="text-muted-foreground">
                                        {t("balanceAfter", {
                                            amount: formatCurrency(roundMoney(store.totalAmount + numericAmount)),
                                            currency: symbol,
                                        })}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="flex-row">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 sm:flex-none"
                        disabled={isPending}
                        onClick={() => onOpenChange(false)}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant={isUndo ? "destructive" : "default"}
                        className="flex-1 sm:flex-none"
                        disabled={isPending}
                        onClick={() => void submit()}
                    >
                        {isPending ? t("saving") : isUndo ? t("undoConfirm") : t("confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
