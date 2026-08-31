"use client";

import useStore from "store/general";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "ui/dialog";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { CURRENCY, CURRENCY_CHOSEN_EVENT, USER_CURRENCY_STORAGE_KEY } from "constants/index";
import { useTranslations } from "next-intl";
import { getCurrencySymbol } from "lib/currency";

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

    const setUserCurrency = useStore((state) => state.setUserCurrency);

    const [currency, setCurrency] = useState<CURRENCY | null>(null);
    const [open, setOpen] = useState(false);
    const [selectionRequired, setSelectionRequired] = useState(false);

    const handleChange = (currency: CURRENCY) => {
        setCurrency(currency);
        setUserCurrency(currency);
        setSelectionRequired(false);
        setOpen(false);

        try {
            localStorage.setItem(USER_CURRENCY_STORAGE_KEY, JSON.stringify(currency));
        } catch {
            // private mode: the choice holds for this session only
        }

        // The onboarding tour waits for this. It used to open on a timer, land
        // on top of this dialog, and inherit the `pointer-events: none` Radix
        // puts on the body while a modal is open, so nothing was tappable.
        window.dispatchEvent(new Event(CURRENCY_CHOSEN_EVENT));
    };

    useEffect(() => {
        const stored = readStoredCurrency();

        if (!stored) {
            setSelectionRequired(true);
            setOpen(true);
            return;
        }

        setSelectionRequired(false);
        setCurrency(stored);
        setUserCurrency(stored);
    }, [setUserCurrency]);

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

                <p className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-300">
                    {t("currencySelection.changeHint")}
                </p>
                <Select onValueChange={(val: CURRENCY) => handleChange(val)} value={currency ?? undefined}>
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
            </DialogContent>
        </Dialog>
    );
};
