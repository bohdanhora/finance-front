"use client";

import { useForm } from "react-hook-form";
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
    DialogTrigger,
} from "ui/dialog";
import { Input } from "ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import { useSetNextMonthTotalAmount } from "api/main";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { useState } from "react";
import { toast } from "react-toastify";
import { changeNextMonthFormSchema } from "schemas/other";
import { CURRENCY, currencyArray } from "constants/index";
import useBankStore from "store/bank";
import { getCurrencySymbol } from "lib/currency";

export const ChangeNextMonthIncome = () => {
    const store = useStore();
    const bankStore = useBankStore();

    const userCurrency = store.userCurrency;

    const { mutateAsync: setNextMonthAmountAsync } = useSetNextMonthTotalAmount();
    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs");

    const form = useForm<z.infer<typeof changeNextMonthFormSchema>>({
        resolver: zodResolver(changeNextMonthFormSchema),
        defaultValues: {
            value: "",
            currency: userCurrency === CURRENCY.UAH ? currencyArray[0] : currencyArray[1],
        },
    });

    const onSubmit = async (values: z.infer<typeof changeNextMonthFormSchema>) => {
        const usdRate = bankStore.usd?.rateBuy ?? 0;
        const eurRate = bankStore.eur?.rateBuy ?? 0;

        const convertToUah = (value: number, currency: string): number => {
            switch (currency) {
                case "$":
                    return value * usdRate;
                case "€":
                    return value * eurRate;
                case "₴":
                default:
                    return value;
            }
        };

        const valueInUah = convertToUah(Number(values.value), values.currency || currencyArray[0]);

        try {
            store.setNextMonthTotalAmount(valueInUah);

            await setNextMonthAmountAsync({
                nextMonthTotalAmount: valueInUah,
            });

            form.reset();
            setOpen(false);

            toast.success(
                tGlobal("toasts.nextMonthIcomeChanged", {
                    amount: formatCurrency(valueInUah),
                    currency: getCurrencySymbol(userCurrency),
                }),
            );
        } catch (error) {
            console.error(t("changeNextMonthIncomeRequestError"), error);
            toast.error(t("changeNextMonthIncomeError"));
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="default">{t("changeNextMonthIncome")}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>{t("expectedIncome")}</DialogTitle>
                            <DialogDescription>{t("planNextMonth")}</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center w-full gap-x-10">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem className={twMerge(userCurrency === CURRENCY.UAH ? "w-3/4" : "w-full")}>
                                        <FormLabel>{t("inputIncome")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("inputIncome")}
                                                className="w-full"
                                                {...field}
                                                onChange={handleDecimalInputChange(field.onChange)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {userCurrency === CURRENCY.UAH && (
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem className="w-1/4">
                                            <FormLabel>{t("currency")}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t("currencyPlaceholder")} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {currencyArray.map((item) => (
                                                        <SelectItem
                                                            value={item}
                                                            key={item}
                                                            className="flex items-center justify-between gap-x-7"
                                                        >
                                                            {item}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive">{t("cancel")}</Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                            >
                                {t("submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
