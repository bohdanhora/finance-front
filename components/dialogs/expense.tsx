"use client";

import React, { useState } from "react";
import useStore from "store/general";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
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

import { MinusIcon, PiggyBank } from "lucide-react";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { Textarea } from "ui/textarea";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { useSetNewTransaction } from "api/main";
import { TransactionEnum } from "constants/index";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { getIncomeFormSchema } from "schemas/other";
import { getCurrencySymbol } from "lib/currency";
import { CategoryCombobox } from "components/categories/category-combobox";
import { DateObjectPicker } from "components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { SavingsStorage } from "types/transactions";

export const ExpenseDialogComponent = () => {
    const store = useStore();
    const userCurrency = store.userCurrency;

    const t = useTranslations();

    const { mutateAsync: setNewTransactionAsync, isPending: setNewTransactionPending } = useSetNewTransaction();

    const [open, setOpen] = useState(false);

    const formSchema = getIncomeFormSchema(store.totalAmount);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
            description: "",
            categories: "",
            savingsStorage: SavingsStorage.CARD,
            date: new Date(),
        },
    });

    const resetForm = () => {
        form.reset({
            value: "",
            description: "",
            categories: "",
            savingsStorage: SavingsStorage.CARD,
            date: new Date(),
        });
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const createTransaction = {
            transactionType: TransactionEnum.EXPENSE,
            id: uuidv4(),
            value: Number(values.value),
            date: values.date,
            categorie: values.categories,
            description: values.description || "",
            savingsStorage: values.categories === "savings" ? values.savingsStorage : undefined,
            savingsCurrency: values.categories === "savings" ? userCurrency : undefined,
        };

        try {
            const response = await setNewTransactionAsync(createTransaction);

            store.setTotalAmount(response.updatedTotals.totalAmount);
            store.setTotalIncome(response.updatedTotals.totalIncome);
            store.setTotalSpend(response.updatedTotals.totalSpend);
            store.setTransactions(response.updatedItems);
            store.setSavingsOperations(response.updatedSavingsOperations);

            toast.success(
                t(values.categories === "savings" ? "toasts.movedToSavings" : "toasts.addedExpense", {
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

    const selectedCategory = form.watch("categories");

    const handleOpenChange = (isOpen: boolean) => {
        if (store.totalAmount <= 0 && isOpen) {
            toast.warning(t("toasts.noFunds"));
            return;
        }
        if (!isOpen) resetForm();
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button
                        variant="secondary"
                        className="border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-400 dark:hover:bg-rose-400/20"
                    >
                        <MinusIcon />
                        {t("expenses.expense")}
                    </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("dialogs.enterExpense")}</DialogTitle>
                            <DialogDescription>{t("dialogs.expenseHint")}</DialogDescription>
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
                            name="categories"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dialogs.category")}</FormLabel>
                                    <CategoryCombobox value={field.value} onChange={field.onChange} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {selectedCategory === "savings" && (
                            <div className="space-y-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
                                <div className="flex items-start gap-3 text-sm">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                                        <PiggyBank className="size-4" />
                                    </span>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {t("dialogs.savingsExpenseHint")}
                                    </p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="savingsStorage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("savings.storage")}</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(SavingsStorage).map((storage) => (
                                                        <SelectItem key={storage} value={storage}>
                                                            {t(`savings.${storage}`)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
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
