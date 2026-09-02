"use client";

import useStore from "store/general";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "ui/dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { CURRENCY, CURRENCY_CHOSEN_EVENT, USER_CURRENCY_STORAGE_KEY } from "constants/index";
import { useTranslations } from "next-intl";
import { getCurrencySymbol } from "lib/currency";
import useBankStore from "store/bank";
import { convertSavingsCurrency } from "lib/savings";
import { useChangeCurrency } from "api/main";
import { useQueryClient } from "@tanstack/react-query";
import { AllTransactionsInfoResponse } from "types/transactions";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

/** Anything but one of the three known codes means the stored value is junk. */
const readStoredCurrency = () => {
    try {
        const raw = localStorage.getItem(USER_CURRENCY_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        return Object.values(CURRENCY).includes(parsed) ? (parsed as CURRENCY) : null;
    } catch {
        return null;
    }
};

export const ChoooseCurrency = () => {
    const t = useTranslations("dialogs");
    const tNav = useTranslations("navbar");

    const userCurrency = useStore((state) => state.userCurrency);
    const currencyInitialized = useStore((state) => state.currencyInitialized);
    const bank = useBankStore();
    const queryClient = useQueryClient();
    const initializationAttempted = useRef(false);
    const { mutateAsync: changeCurrencyAsync, isPending } = useChangeCurrency();

    const [currency, setCurrency] = useState<CURRENCY | null>(null);
    const [open, setOpen] = useState(false);
    const [selectionRequired, setSelectionRequired] = useState(false);

    const persistCurrency = useCallback((nextCurrency: CURRENCY) => {
        try {
            localStorage.setItem(USER_CURRENCY_STORAGE_KEY, JSON.stringify(nextCurrency));
        } catch {
            // private mode: the choice holds for this session only
        }
    }, []);

    const applyUpdatedInfo = useCallback(
        (data: AllTransactionsInfoResponse, fallbackCurrency: CURRENCY) => {
            const nextCurrency = data.currency ?? fallbackCurrency;
            useStore.setState({
                totalAmount: data.totalAmount ?? 0,
                totalIncome: data.totalIncome ?? 0,
                totalSpend: data.totalSpend ?? 0,
                nextMonthTotalAmount: data.nextMonthTotalAmount ?? 0,
                percentage: data.savePercent ?? 0,
                defaultEssentialsArray: data.defaultEssentialsArray ?? [],
                essentialsArray: data.essentialsArray ?? [],
                nextMonthEssentialsArray: data.nextMonthEssentialsArray ?? [],
                transactions: data.transactions ?? [],
                savingsGoals: data.savingsGoals ?? [],
                savingsOperations: data.savingsOperations ?? [],
                userCurrency: nextCurrency,
                currencyInitialized: true,
            });
            queryClient.setQueriesData<AllTransactionsInfoResponse>({ queryKey: ["all-info"] }, data);
            setCurrency(nextCurrency);
            persistCurrency(nextCurrency);
        },
        [persistCurrency, queryClient],
    );

    const finishSelection = (nextCurrency: CURRENCY) => {
        setSelectionRequired(false);
        setOpen(false);
        persistCurrency(nextCurrency);
        window.dispatchEvent(new Event(CURRENCY_CHOSEN_EVENT));
    };

    const handleChange = async (nextCurrency: CURRENCY) => {
        if (isPending) return;

        if (currencyInitialized && nextCurrency === userCurrency) {
            finishSelection(nextCurrency);
            return;
        }

        const sourceCurrency = currency ?? (selectionRequired ? undefined : userCurrency);
        const conversionRate = sourceCurrency
            ? convertSavingsCurrency(1, sourceCurrency, nextCurrency, {
                  usdToUah: bank.usd?.rateBuy ?? 0,
                  eurToUah: bank.eur?.rateBuy ?? 0,
              })
            : 1;

        if (sourceCurrency !== nextCurrency && conversionRate === null) {
            toast.error(t("currencySelection.rateUnavailable"));
            return;
        }

        try {
            const result = await changeCurrencyAsync({
                ...(sourceCurrency ? { fromCurrency: sourceCurrency } : {}),
                toCurrency: nextCurrency,
                ...(sourceCurrency !== nextCurrency ? { conversionRate: conversionRate ?? undefined } : {}),
            });
            applyUpdatedInfo(result.updatedInfo, nextCurrency);
            finishSelection(nextCurrency);
        } catch {
            // The shared API error handler keeps the current currency visible.
        }
    };

    useEffect(() => {
        if (currencyInitialized) {
            setSelectionRequired(false);
            setCurrency(userCurrency);
            persistCurrency(userCurrency);
            return;
        }

        const stored = readStoredCurrency();

        if (!stored) {
            setSelectionRequired(true);
            setOpen(true);
            return;
        }

        setSelectionRequired(false);
        setCurrency(stored);
        useStore.setState({ userCurrency: stored });

        if (!initializationAttempted.current) {
            initializationAttempted.current = true;
            void changeCurrencyAsync({
                fromCurrency: stored,
                toCurrency: stored,
            })
                .then((result) => applyUpdatedInfo(result.updatedInfo, stored))
                .catch(() => {
                    // The existing local choice remains usable; retry happens
                    // when the user next opens the selector.
                });
        }
    }, [applyUpdatedInfo, changeCurrencyAsync, currencyInitialized, persistCurrency, userCurrency]);

    useEffect(() => {
        const openSelection = () => setOpen(true);
        window.addEventListener("finance:open-currency-selection", openSelection);

        return () => window.removeEventListener("finance:open-currency-selection", openSelection);
    }, []);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!selectionRequired || nextOpen) {
                    setOpen(nextOpen);
                }
            }}
        >
            <DialogContent
                className="sm:max-w-[425px]"
                showCloseButton={!selectionRequired}
                onInteractOutside={(e) => {
                    if (selectionRequired) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (selectionRequired) e.preventDefault();
                }}
            >
                <DialogTitle>{t("currencySelection.title")}</DialogTitle>
                <DialogDescription>{t("currencySelection.changeDescription")}</DialogDescription>

                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-3 py-2.5 text-sm text-indigo-700 dark:text-indigo-300">
                    <p>{t("currencySelection.changeHint")}</p>
                    <p className="mt-1 text-xs opacity-80">{t("currencySelection.savingsHint")}</p>
                </div>
                <Select
                    disabled={isPending}
                    onValueChange={(val: CURRENCY) => void handleChange(val)}
                    value={currency ?? undefined}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("currencySelection.choose")}>
                            {currency && (
                                <span className="flex items-center gap-2">
                                    <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 font-semibold text-indigo-600 dark:text-indigo-300">
                                        {getCurrencySymbol(currency)}
                                    </span>
                                    <span>{tNav(currency)}</span>
                                    <span className="text-muted-foreground text-xs font-medium uppercase">
                                        {currency}
                                    </span>
                                </span>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                        {Object.values(CURRENCY).map((item) => (
                            <SelectItem value={item} key={item} className="min-h-12">
                                <span className="flex w-full items-center gap-3">
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 font-semibold text-indigo-600 dark:text-indigo-300">
                                        {getCurrencySymbol(item)}
                                    </span>
                                    <span className="min-w-0 flex-1">{tNav(item)}</span>
                                    <span className="text-muted-foreground pr-2 text-xs font-medium uppercase">
                                        {item}
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {isPending && (
                    <p className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Loader2 className="size-3.5 animate-spin" />
                        {t("currencySelection.converting")}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
};
