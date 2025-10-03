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
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import useBankStore from "store/bank";
import { toast } from "react-toastify";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { useSetNextMonthTotalAmount } from "api/main";
import { useState } from "react";
import { nextMonthIncomeFormSchema } from "schemas/other";
import { CURRENCY, currencyArray } from "constants/index";
import { getCurrencySymbol } from "lib/currency";

export const NextMonthIncomeCalculate = () => {
    const store = useStore();
    const bankStore = useBankStore();

    const userCurrency = useStore((state) => state.userCurrency);

    const { mutateAsync: setNextMonthAmountAsync, isPending: nextMonthAmountPending } = useSetNextMonthTotalAmount();
    const [open, setOpen] = useState(false);

    const t = useTranslations("dialogs");
    const tToast = useTranslations("toasts");

    const form = useForm<z.infer<typeof nextMonthIncomeFormSchema>>({
        resolver: zodResolver(nextMonthIncomeFormSchema),
        values: {
            rate: "",
            hours: "",
            customValue: "",
            currency: userCurrency === CURRENCY.UAH ? currencyArray[0] : currencyArray[1],
        },
    });

    const onSubmit = async (values: z.infer<typeof nextMonthIncomeFormSchema>) => {
        const { rate, hours, customValue, currency } = values;

        const rateMultiplyHours = Number(rate) * Number(hours);
        const usdRate = bankStore.usd?.rateBuy ?? 0;
        const eurRate = bankStore.eur?.rateBuy ?? 0;

        const convertToUah = (value: number, currency: string): number => {
            switch (currency) {
                case "$":
                    return value * usdRate;
                case "€":
                    return value * eurRate;
                case "₴":
                    return value;
                default:
                    return value;
            }
        };

        const rateInUah = rateMultiplyHours * usdRate;
        const totalRate = userCurrency === CURRENCY.UAH ? rateInUah : rateMultiplyHours;

        const customInUah = customValue ? convertToUah(Number(customValue), currency || currencyArray[0]) : 0;

        const result = totalRate + customInUah;

        try {
            store.setNextMonthTotalAmount(result);
            await setNextMonthAmountAsync({ nextMonthTotalAmount: result });

            toast.success(
                tToast("nextMonthIcomeChanged", {
                    amount: formatCurrency(result),
                    currency: getCurrencySymbol(userCurrency),
                }),
            );
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error("Error setting next month amount:", error);
            toast.error(tToast("nextMonthIcomeFailed", { defaultValue: "Something went wrong. Please try again." }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="default">{t("calculateNextMonthIncome")}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>{t("calculate")}</DialogTitle>
                            <DialogDescription>{t("calculateByRate")}</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center w-full gap-x-10">
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("rate")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("ratePlaceholder")}
                                                {...field}
                                                onChange={handleDecimalInputChange(field.onChange)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="hours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("hours")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("hoursPlaceholder")}
                                                {...field}
                                                onChange={(e) => {
                                                    const val = e.target.value;

                                                    if (val === "") {
                                                        field.onChange(val);
                                                        return;
                                                    }

                                                    if (!/^(0|[1-9]\d*)?$/.test(val)) return;

                                                    field.onChange(val);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center w-full gap-x-10">
                            <FormField
                                control={form.control}
                                name="customValue"
                                render={({ field }) => (
                                    <FormItem className={twMerge(userCurrency === CURRENCY.UAH ? "w-3/4" : "w-full")}>
                                        <FormLabel>{t("additionalAmount")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("additionalAmountPlaceholder")}
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
                                disabled={nextMonthAmountPending}
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
