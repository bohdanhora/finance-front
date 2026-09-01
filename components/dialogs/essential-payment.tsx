"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { useSetCheckedEssential } from "api/main";
import { EssentialsType } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import useStore from "store/general";
import { EssentialType } from "types/transactions";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "ui/dialog";
import { Input } from "ui/input";
import { Label } from "ui/label";

type Props = {
    essential: EssentialType | null;
    type: EssentialsType.THIS_MONTH | EssentialsType.NEXT_MONTH;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const EssentialPaymentDialog = ({ essential, type, open, onOpenChange }: Props) => {
    const t = useTranslations("dialogs.essentials.payment");
    const store = useStore();
    const { mutateAsync: setCheckedEssential, isPending } = useSetCheckedEssential();
    const [actualAmount, setActualAmount] = useState("");
    const [error, setError] = useState<string | null>(null);

    const isUndo = Boolean(essential?.checked);
    const symbol = getCurrencySymbol(store.userCurrency);
    const numericAmount = Number(actualAmount);
    const hasValidAmount = actualAmount.length > 0 && Number.isFinite(numericAmount) && numericAmount > 0;
    const difference = useMemo(
        () => (essential && hasValidAmount ? roundMoney(essential.amount - numericAmount) : 0),
        [essential, hasValidAmount, numericAmount],
    );

    useEffect(() => {
        if (!open || !essential) return;
        setActualAmount(String(essential.paidAmount ?? essential.amount));
        setError(null);
    }, [essential, open]);

    const submit = async () => {
        if (!essential) return;

        if (!isUndo && !hasValidAmount) {
            setError(t("invalidAmount"));
            return;
        }
        if (!isUndo && numericAmount > store.totalAmount) {
            setError(t("notEnoughFunds"));
            return;
        }

        setError(null);
        try {
            const response = await setCheckedEssential({
                type,
                item: {
                    id: essential.id,
                    checked: !isUndo,
                    ...(!isUndo && { actualAmount: roundMoney(numericAmount) }),
                },
            });

            if (type === EssentialsType.NEXT_MONTH) store.setNextMonthEssentialsArray(response.updatedItems);
            else store.setEssentialsArray(response.updatedItems);
            store.setTotalAmount(response.updatedTotals.totalAmount);
            store.setTotalIncome(response.updatedTotals.totalIncome);
            store.setTotalSpend(response.updatedTotals.totalSpend);
            store.setTransactions(response.updatedTransactions);

            const changedAmount = isUndo ? (essential.paidAmount ?? essential.amount) : numericAmount;
            toast.success(
                t(isUndo ? "undoSuccess" : "success", {
                    amount: formatCurrency(changedAmount),
                    currency: symbol,
                }),
            );
            onOpenChange(false);
        } catch (requestError) {
            console.error(requestError);
        }
    };

    if (!essential) return null;

    const paidAmount = essential.paidAmount ?? essential.amount;
    const balanceAfterPayment = roundMoney(store.totalAmount - (hasValidAmount ? numericAmount : 0));

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isUndo ? t("undoTitle") : t("title", { title: essential.title })}</DialogTitle>
                    <DialogDescription>
                        {isUndo
                            ? t("undoDescription", {
                                  amount: formatCurrency(paidAmount),
                                  currency: symbol,
                              })
                            : t("description")}
                    </DialogDescription>
                </DialogHeader>

                {isUndo ? (
                    <div className="border-border bg-muted/30 rounded-xl border p-4">
                        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            {t("returnToBalance")}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            +{formatCurrency(paidAmount)} {symbol}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="border-border bg-muted/30 flex items-center justify-between gap-4 rounded-xl border p-4">
                            <span className="text-muted-foreground text-sm">{t("planned")}</span>
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(essential.amount)} {symbol}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor={"essential-payment-" + essential.id}>{t("actualAmount")}</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-auto px-2 py-1 text-xs"
                                    onClick={() => {
                                        setActualAmount(String(essential.amount));
                                        setError(null);
                                    }}
                                >
                                    {t("usePlanned")}
                                </Button>
                            </div>
                            <div className="relative">
                                <Input
                                    id={"essential-payment-" + essential.id}
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

                        {hasValidAmount && (
                            <div className="space-y-1 text-sm">
                                {difference > 0 && (
                                    <p className="text-emerald-600 dark:text-emerald-400">
                                        {t("saved", { amount: formatCurrency(difference), currency: symbol })}
                                    </p>
                                )}
                                {difference < 0 && (
                                    <p className="text-rose-600 dark:text-rose-400">
                                        {t("overPlan", {
                                            amount: formatCurrency(Math.abs(difference)),
                                            currency: symbol,
                                        })}
                                    </p>
                                )}
                                {difference === 0 && <p className="text-muted-foreground">{t("matchesPlan")}</p>}
                                <p className="text-muted-foreground">
                                    {t("balanceAfter", {
                                        amount: formatCurrency(Math.max(0, balanceAfterPayment)),
                                        currency: symbol,
                                    })}
                                </p>
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
