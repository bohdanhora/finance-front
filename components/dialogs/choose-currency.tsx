"use client";

import useStore from "store/general";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "ui/dialog";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { CURRENCY } from "constants/index";
import { useTranslations } from "next-intl";

export const ChoooseCurrency = () => {
    const t = useTranslations("dialogs");

    const store = useStore();

    const [currency, setCurrency] = useState<CURRENCY | null>(null);
    const [open, setOpen] = useState(false);

    const handleChange = (currency: CURRENCY) => {
        setCurrency(currency);
        store.setUserCurrency(currency);
        setOpen(false);
        localStorage.setItem("currency", JSON.stringify(currency));
    };

    useEffect(() => {
        const localStorageCurrency = localStorage.getItem("currency");
        if (!localStorageCurrency) {
            setOpen(true);
            return;
        }
        store.setUserCurrency(JSON.parse(localStorageCurrency));
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

                <p className="text-red-500 text-sm mt-2">⚠️ {t("currencySelection.important")}</p>
                <Select onValueChange={(val: CURRENCY) => handleChange(val)} value={currency ?? undefined}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("currencySelection.choose")} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(CURRENCY).map((item) => (
                            <SelectItem
                                value={item}
                                key={item}
                                className="flex items-center justify-between gap-x-7 uppercase"
                            >
                                {item}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </DialogContent>
        </Dialog>
    );
};
