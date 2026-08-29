"use client";

import useStore from "store/general";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "ui/dialog";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { CURRENCY, CURRENCY_CHOSEN_EVENT, USER_CURRENCY_STORAGE_KEY } from "constants/index";
import { useTranslations } from "next-intl";

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

    const store = useStore();

    const [currency, setCurrency] = useState<CURRENCY | null>(null);
    const [open, setOpen] = useState(false);

    const handleChange = (currency: CURRENCY) => {
        setCurrency(currency);
        store.setUserCurrency(currency);
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
            setOpen(true);
            return;
        }

        setCurrency(stored);
        store.setUserCurrency(stored);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="sm:max-w-[425px]"
                showCloseButton={false}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogTitle>{t("currencySelection.title")}</DialogTitle>
                <DialogDescription>{t("currencySelection.description")}</DialogDescription>

                <p className="mt-2 text-sm text-red-500">⚠️ {t("currencySelection.important")}</p>
                <Select onValueChange={(val: CURRENCY) => handleChange(val)} value={currency ?? undefined}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("currencySelection.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(CURRENCY).map((item) => (
                            <SelectItem value={item} key={item} className="min-h-11 uppercase">
                                {item}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </DialogContent>
        </Dialog>
    );
};
