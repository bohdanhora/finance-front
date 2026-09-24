"use client";

import React, { useEffect, useMemo, useState } from "react";
import useStore from "store/general";
import useBankStore from "store/bank";

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
import { CURRENCY, TransactionEnum } from "constants/index";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { getExpenseFormSchema } from "schemas/other";
import { getCurrencySymbol } from "lib/currency";
import { getExchangeRate } from "lib/savings";
import { roundMoney, toRateInput } from "lib/money";
import { useValidationMessages } from "lib/validation";
import { CategoryCombobox } from "components/categories/category-combobox";
import { DateObjectPicker } from "components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { SavingsStorage } from "types/transactions";
import { CardSelect } from "components/cards/card-select";
import { defaultCardId, spendableOnCard } from "lib/cards";

export const ExpenseDialogComponent = () => {
    const store = useStore();
    const userCurrency = store.userCurrency;
    const usdToUah = useBankStore((state) => state.usd?.rateBuy ?? 0);
    const eurToUah = useBankStore((state) => state.eur?.rateBuy ?? 0);

    const t = useTranslations();
    const validationMessages = useValidationMessages();

    const { mutateAsync: setNewTransactionAsync, isPending: setNewTransactionPending } = useSetNewTransaction();

    const [open, setOpen] = useState(false);
    const [cardId, setCardId] = useState("");
    const cardBalance = spendableOnCard(store.cards, cardId, store.totalAmount);

    const rates = useMemo(() => ({ usdToUah, eurToUah }), [eurToUah, usdToUah]);

    const formSchema = useMemo(
        () =>
            getExpenseFormSchema(validationMessages, {
                totalAmount: cardBalance,
                balanceLabel: `${formatCurrency(cardBalance)} ${getCurrencySymbol(userCurrency)}`,
                userCurrency,
            }),
        [cardBalance, userCurrency, validationMessages],
    );

    const getEmptyValues = () => ({
        value: "",
        description: "",
        categories: "",
        savingsStorage: SavingsStorage.CARD,
        savingsCurrency: userCurrency,
        savingsRate: "",
        date: new Date(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyValues(),
    });

    const resetForm = () => {
        form.reset(getEmptyValues());
    };

    const selectedCategory = form.watch("categories");
    const savingsCurrency = form.watch("savingsCurrency");
    const savingsRate = form.watch("savingsRate");
    const value = Number(form.watch("value")) || 0;

    const currentRate = savingsCurrency === userCurrency ? 1 : getExchangeRate(savingsCurrency, userCurrency, rates);
    const currentRateInput = currentRate ? toRateInput(currentRate) : "";
    const enteredRate = Number(savingsRate) || 0;
    const savedAmount = enteredRate > 0 ? roundMoney(value / enteredRate) : 0;

    useEffect(() => {
        if (savingsCurrency === userCurrency) return;
        form.setValue("savingsRate", currentRateInput, { shouldValidate: true });
    }, [currentRateInput, form, savingsCurrency, userCurrency]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const isSavings = values.categories === "savings";
        const rate = Number(values.savingsRate) || 0;
        const convertedAmount =
            isSavings && values.savingsCurrency !== userCurrency ? roundMoney(Number(values.value) / rate) : undefined;

        const createTransaction = {
            transactionType: TransactionEnum.EXPENSE,
            id: uuidv4(),
            value: Number(values.value),
            date: values.date,
            categorie: values.categories,
            description: values.description || "",
            savingsStorage: isSavings ? values.savingsStorage : undefined,
            savingsCurrency: isSavings ? values.savingsCurrency : undefined,
            savingsAmount: convertedAmount,
            cardId: cardId || undefined,
        };

        try {
            const response = await setNewTransactionAsync(createTransaction);

            store.applyServerUpdate(response);
            store.setTransactions(response.updatedItems);
            store.setSavingsOperations(response.updatedSavingsOperations);

            toast.success(
                t(isSavings ? "toasts.movedToSavings" : "toasts.addedExpense", {
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

    const handleOpenChange = (isOpen: boolean) => {
        if (store.totalAmount <= 0 && isOpen) {
            toast.warning(t("toasts.noFunds"));
            return;
        }
        if (!isOpen) resetForm();
        if (isOpen) setCardId(defaultCardId(store.selectedCardId, store.cards));
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
                        <CardSelect
                            id="expense-card"
                            label={t("cards.fromCard")}
                            value={cardId}
                            onChange={(value) => {
                                setCardId(value);
                                if (form.getValues("value")) void form.trigger("value");
                            }}
                        />
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dialogs.amount")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            inputMode="decimal"
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
                                <div className="grid gap-3 sm:grid-cols-2">
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
                                    <FormField
                                        control={form.control}
                                        name="savingsCurrency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("dialogs.savingsCurrency")}</FormLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.values(CURRENCY).map((currency) => (
                                                            <SelectItem key={currency} value={currency}>
                                                                {t(`navbar.${currency}`)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {savingsCurrency !== userCurrency && (
                                    <FormField
                                        control={form.control}
                                        name="savingsRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("dialogs.savingsRate")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        inputMode="decimal"
                                                        placeholder={currentRateInput || "0"}
                                                        {...field}
                                                        onChange={handleDecimalInputChange(field.onChange, 4)}
                                                    />
                                                </FormControl>
                                                <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                                    <span>
                                                        {t("dialogs.savingsRateHint", {
                                                            currency: getCurrencySymbol(savingsCurrency),
                                                            rate: field.value || "?",
                                                            base: getCurrencySymbol(userCurrency),
                                                        })}
                                                    </span>
                                                    {currentRateInput ? (
                                                        field.value !== currentRateInput && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    form.setValue("savingsRate", currentRateInput, {
                                                                        shouldValidate: true,
                                                                    })
                                                                }
                                                                className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
                                                            >
                                                                {t("dialogs.savingsRateCurrent", {
                                                                    rate: currentRateInput,
                                                                })}
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span>{t("dialogs.savingsRateUnavailable")}</span>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {savingsCurrency !== userCurrency && savedAmount > 0 && (
                                    <p className="text-sm font-medium">
                                        {t("dialogs.savingsConverted", {
                                            amount: `${formatCurrency(savedAmount)} ${getCurrencySymbol(savingsCurrency)}`,
                                        })}
                                    </p>
                                )}
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
