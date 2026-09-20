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
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { changeNextMonthFormSchema } from "schemas/other";
import { useValidationMessages } from "lib/validation";
import { CURRENCY, currencyArray } from "constants/index";
import useBankStore from "store/bank";
import { getCurrencySymbol } from "lib/currency";

export const ChangeNextMonthIncome = () => {
    const store = useStore();
    const bankStore = useBankStore();

    const userCurrency = useStore((state) => state.userCurrency);

    const { mutateAsync: setNextMonthAmountAsync, isPending } = useSetNextMonthTotalAmount();
    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs");

    const getEmptyValues = () => ({
        rate: "",
        hours: "",
        amount: "",
        currency: userCurrency === CURRENCY.UAH ? currencyArray[0] : currencyArray[1],
    });

    const validationMessages = useValidationMessages();
    const formSchema = useMemo(() => changeNextMonthFormSchema(validationMessages), [validationMessages]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyValues(),
    });

    const byRate = form.watch("rate") !== "" || form.watch("hours") !== "";

    const handleOpenChange = (nextOpen: boolean) => {
        form.reset(getEmptyValues());
        setOpen(nextOpen);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const usdRate = bankStore.usd?.rateBuy ?? 0;
        const eurRate = bankStore.eur?.rateBuy ?? 0;

        const convertToUah = (value: number, currency: string): number => {
            switch (currency) {
                case "$":
                    return value * usdRate;
                case "€":
                    return value * eurRate;
                default:
                    return value;
            }
        };

        const fromRate = values.rate !== "" ? Number(values.rate) * Number(values.hours) : 0;
        const total = fromRate + (Number(values.amount) || 0);
        const valueInUah = convertToUah(total, values.currency || currencyArray[0]);

        try {
            store.setNextMonthTotalAmount(valueInUah);

            await setNextMonthAmountAsync({
                nextMonthTotalAmount: valueInUah,
            });

            handleOpenChange(false);

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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="secondary">{t("changeNextMonthIncome")}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("expectedIncome")}</DialogTitle>
                            <DialogDescription>{t("nextMonthIncomeHint")}</DialogDescription>
                        </DialogHeader>
                        <div className="grid w-full grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("rate")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="decimal"
                                                placeholder={t("optional")}
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
                                                inputMode="decimal"
                                                placeholder={t("optional")}
                                                {...field}
                                                onChange={handleDecimalInputChange(field.onChange)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid w-full grid-cols-[minmax(0,1fr)_5.5rem] items-end gap-3">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem className={twMerge(userCurrency !== CURRENCY.UAH && "col-span-2")}>
                                        <FormLabel>{byRate ? t("additionalAmount") : t("fixedAmount")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="decimal"
                                                placeholder={byRate ? t("optional") : t("inputIncome")}
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
                                        <FormItem>
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
                                <Button variant="secondary">{t("cancel")}</Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={isPending}
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
