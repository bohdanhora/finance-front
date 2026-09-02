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
import { Textarea } from "ui/textarea";
import { PlusIcon } from "lucide-react";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import { useSetNewTransaction } from "api/main";
import { v4 as uuidv4 } from "uuid";
import { TransactionEnum } from "constants/index";
import { useState } from "react";
import dayjs from "dayjs";
import { incomeFormSchema } from "schemas/other";
import { getCurrencySymbol } from "lib/currency";
import { DateObjectPicker } from "components/ui/date-picker";

export const IncomeDialogComponent = () => {
    const store = useStore();
    const userCurrency = store.userCurrency;

    const t = useTranslations();

    const { mutateAsync: setNewTransactionAsync, isPending: setNewTransactionPending } = useSetNewTransaction();

    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof incomeFormSchema>>({
        resolver: zodResolver(incomeFormSchema),
        defaultValues: {
            value: "",
            description: "",
            date: new Date(),
        },
    });

    const resetForm = () => {
        form.reset({ value: "", description: "", date: new Date() });
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) resetForm();
        setOpen(nextOpen);
    };

    const onSubmit = async (values: z.infer<typeof incomeFormSchema>) => {
        const createTransaction = {
            transactionType: TransactionEnum.INCOME,
            id: uuidv4(),
            value: Number(values.value),
            date: values.date,
            categorie: TransactionEnum.INCOME,
            description: values.description || "",
        };

        try {
            const response = await setNewTransactionAsync(createTransaction);

            store.setTotalAmount(response.updatedTotals.totalAmount);
            store.setTotalIncome(response.updatedTotals.totalIncome);
            store.setTotalSpend(response.updatedTotals.totalSpend);
            store.setTransactions(response.updatedItems);

            toast.success(
                t("toasts.addedIncome", {
                    amount: formatCurrency(Number(values.value)),
                    currency: getCurrencySymbol(userCurrency),
                }),
            );

            resetForm();
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(t("toasts.errorOccurred") || "Error occurred");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button
                        variant="secondary"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-400 dark:hover:bg-emerald-400/20"
                    >
                        <PlusIcon />
                        {t("expenses.income")}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("dialogs.enterIncome")}</DialogTitle>
                            <DialogDescription>{t("dialogs.incomeReceived")}</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dialogs.amount")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("dialogs.amount")}
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dialogs.description")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("dialogs.description")}
                                            className="min-h-20 resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{t("dialogs.date")}</FormLabel>
                                    <FormControl>
                                        <DateObjectPicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabledDates={(date) =>
                                                dayjs(date).isAfter(dayjs(), "day") ||
                                                dayjs(date).isBefore(dayjs("1900-01-01"), "day")
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">{t("dialogs.cancel")}</Button>
                            </DialogClose>
                            <Button
                                disabled={setNewTransactionPending}
                                type="submit"
                                className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                            >
                                {t("dialogs.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
