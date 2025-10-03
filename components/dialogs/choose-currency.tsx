"use client";

import useStore from "store/general";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "ui/dialog";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { CURRENCY, currencyArray } from "constants/index";

export const ChoooseCurrency = () => {
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Currency Selection</DialogTitle>
                <DialogDescription>
                    Choose the currency you’d like to use. If you select UAH, you’ll also see its value compared to USD
                    and EUR. If you select another currency, all amounts will be shown only in that currency.
                </DialogDescription>
                <Select onValueChange={(val: CURRENCY) => handleChange(val)} value={currency ?? undefined}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="choose" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(CURRENCY).map((item) => (
                            <SelectItem value={item} key={item} className="flex items-center justify-between gap-x-7">
                                {item}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </DialogContent>
        </Dialog>
    );
};
