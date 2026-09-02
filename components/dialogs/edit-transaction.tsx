"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { useEffect } from "react";

import { TransactionType } from "types/transactions";
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
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { Textarea } from "components/ui/textarea";
import { CategoryCombobox } from "components/categories/category-combobox";
import { TransactionEnum } from "constants/index";

const editTransactionSchema = z.object({
    value: z.string().min(1),
    categories: z.string().trim().min(1).max(40),
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
    date: new Date(),
    description: "",
});

export const EditTransactionDialog = ({ transaction, open, onOpenChange, onSubmit }: Props) => {
    const t = useTranslations();

    const form = useForm<z.infer<typeof editTransactionSchema>>({
        resolver: zodResolver(editTransactionSchema),
        defaultValues: getEmptyTransactionValues(),
    });

    useEffect(() => {
        if (!open) return;

        form.reset(
            transaction
                ? {
                      value: String(transaction.value),
                      categories: transaction.categorie,
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
                                    />
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
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="popover"
                                                    type="button"
                                                    className={twMerge(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground",
                                                    )}
                                                >
                                                    {dayjs(field.value).format("DD MMMM YYYY")}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
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
