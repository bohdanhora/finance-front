"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

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
import { TransactionEnum } from "constants/index";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";

const editTransactionSchema = z.object({
    value: z.string().min(1),
    categories: z.string().trim().min(1).max(40),
    savingsStorage: z.nativeEnum(SavingsStorage),
    date: z.date(),
    description: z.string().optional(),
});

interface Props {
    transaction: TransactionType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: z.infer<typeof editTransactionSchema>) => Promise<void>;
}

const getEmptyTransactionValues = () => ({
    value: "",
    categories: "",
    savingsStorage: SavingsStorage.CARD,
    date: new Date(),
    description: "",
});

export const EditTransactionDialog = ({ transaction, open, onOpenChange, onSubmit }: Props) => {
    const t = useTranslations();

    const form = useForm<z.infer<typeof editTransactionSchema>>({
        resolver: zodResolver(editTransactionSchema),
        defaultValues: getEmptyTransactionValues(),
    });
    const selectedCategory = form.watch("categories");

    useEffect(() => {
        if (!open) return;

        form.reset(
            transaction
                ? {
                      value: String(transaction.value),
                      categories: transaction.categorie,
                      savingsStorage: transaction.savingsStorage ?? SavingsStorage.CARD,
                      date: new Date(transaction.date),
                      description: transaction.description ?? "",
                  }
                : getEmptyTransactionValues(),
            { keepDefaultValues: true },
        );
    }, [form, open, transaction]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) form.reset(getEmptyTransactionValues());
        onOpenChange(nextOpen);
    };

    const handleSubmit = async (data: z.infer<typeof editTransactionSchema>) => {
        await onSubmit(data);
        form.reset(getEmptyTransactionValues());
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
                                        <Input {...field} />
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

                        {selectedCategory === "savings" && transaction?.transactionType === TransactionEnum.EXPENSE && (
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
