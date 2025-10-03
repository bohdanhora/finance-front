"use client";

import useStore from "store/general";
import { Button } from "ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "ui/dialog";
import { Input } from "ui/input";
import { twMerge } from "tailwind-merge";
import { handleFrom1To100InputChange } from "lib/utils";
import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "components/ui/select";

export const ChoooseCurrency = () => {
    const store = useStore();

    const [open, setOpen] = useState(false);

    useEffect(() => {
        const localStorageCurrency = localStorage.getItem("currency");
        if (!localStorageCurrency) {
            setOpen(true);
        }
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Currency Selection</DialogTitle>
                <DialogDescription>
                    Choose the currency you’d like to use. If you select UAH, you’ll also see its value compared to USD
                    and EUR. If you select another currency, all amounts will be shown only in that currency.
                </DialogDescription>
                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="uah">UAH</SelectItem>
                            <SelectItem value="usd">USD</SelectItem>
                            <SelectItem value="eur">EUR</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </DialogContent>
        </Dialog>
    );
};
