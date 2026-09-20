"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { SavingsStorage, TransactionType } from "types/transactions";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { DateObjectPicker } from "components/ui/date-picker";
import { Textarea } from "components/ui/textarea";
import { CategoryCombobox } from "components/categories/category-combobox";
import { CURRENCY, TransactionEnum } from "constants/index";
import { roundMoney, toMoneyInput, toRateInput } from "lib/money";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";
import { getExchangeRate } from "lib/savings";
import { useValidationMessages } from "lib/validation";
import { editTransactionFormSchema } from "schemas/other";
import useBankStore from "store/bank";
import useStore from "store/general";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";

export type EditTransactionValues = z.infer<ReturnType<typeof editTransactionFormSchema>> & {
    savingsAmount?: number;
};

const getEmptyTransactionValues = (currency: CURRENCY) => ({
    value: "",
    categories: "",
    savingsStorage: SavingsStorage.CARD,
    savingsCurrency: currency,
    savingsRate: "",
    date: new Date(),
    description: "",
});

interface Props {
    transaction: TransactionType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: EditTransactionValues) => Promise<void>;
}

export const EditTransactionDialog = ({ transaction, open, onOpenChange, onSubmit }: Props) => {
    const t = useTranslations();
    const userCurrency = useStore((state) => state.userCurrency);
    const usdToUah = useBankStore((state) => state.usd?.rateBuy ?? 0);
    const eurToUah = useBankStore((state) => state.eur?.rateBuy ?? 0);
    const validationMessages = useValidationMessages();

    const rates = useMemo(() => ({ usdToUah, eurToUah }), [eurToUah, usdToUah]);
    const formSchema = useMemo(
        () => editTransactionFormSchema(validationMessages, userCurrency),
        [userCurrency, validationMessages],
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyTransactionValues(userCurrency),
    });

    const selectedCategory = form.watch("categories");
    const savingsCurrency = form.watch("savingsCurrency");
    const savingsRate = form.watch("savingsRate");
    const value = Number(form.watch("value")) || 0;

    const isSavingsExpense = selectedCategory === "savings" && transaction?.transactionType === TransactionEnum.EXPENSE;
    const currentRate = savingsCurrency === userCurrency ? 1 : getExchangeRate(savingsCurrency, userCurrency, rates);
    const currentRateInput = currentRate ? toRateInput(currentRate) : "";
    const enteredRate = Number(savingsRate) || 0;
    const savedAmount = enteredRate > 0 ? roundMoney(value / enteredRate) : 0;

    useEffect(() => {
        if (!open) return;

        form.reset(
            transaction
                ? {
                      value: toMoneyInput(transaction.value),
                      categories: transaction.categorie,
                      savingsStorage: transaction.savingsStorage ?? SavingsStorage.CARD,
                      savingsCurrency: transaction.savingsCurrency ?? userCurrency,
                      savingsRate: "",
                      date: new Date(transaction.date),
                      description: transaction.description ?? "",
                  }
                : getEmptyTransactionValues(userCurrency),
            { keepDefaultValues: true },
        );
    }, [form, open, transaction, userCurrency]);

    useEffect(() => {
        if (savingsCurrency === userCurrency) return;
        form.setValue("savingsRate", currentRateInput, { shouldValidate: true });
    }, [currentRateInput, form, savingsCurrency, userCurrency]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) form.reset(getEmptyTransactionValues(userCurrency));
        onOpenChange(nextOpen);
    };

    const handleSubmit = async (data: z.infer<typeof formSchema>) => {
        const converts = isSavingsExpense && data.savingsCurrency !== userCurrency;

        await onSubmit({
            ...data,
            savingsAmount: converts ? roundMoney(Number(data.value) / enteredRate) : undefined,
        });
        form.reset(getEmptyTransactionValues(userCurrency));
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Form {...form}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("transactions.editTransactionTitle")}</DialogTitle>
                            <DialogDescription>{t("transactions.editTransactionSubtitle")}</DialogDescription>
                        </DialogHeader>

                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dialogs.amount")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            inputMode="decimal"
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
                                    <CategoryCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                        includeIncome={transaction?.transactionType === TransactionEnum.INCOME}
                                        excludedKeys={
                                            transaction?.transactionType === TransactionEnum.INCOME ? ["savings"] : []
                                        }
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isSavingsExpense && (
                            <div className="space-y-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
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
                                        <DateObjectPicker value={field.value} onChange={field.onChange} />
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
                                        <Textarea {...field} className="min-h-20 resize-none" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">{t("dialogs.cancel")}</Button>
                            </DialogClose>
                            <Button type="submit">{t("dialogs.setTotal.save")}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
