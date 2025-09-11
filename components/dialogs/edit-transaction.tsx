"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { Textarea } from "components/ui/textarea";

const editTransactionSchema = z.object({
    value: z.string().min(1),
    categories: z.string().min(1),
    date: z.date(),
    description: z.string().optional(),
});

interface Props {
    transaction: TransactionType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: z.infer<typeof editTransactionSchema>) => Promise<void>;
}

const categoryKeys = [
    "groceries",
    "cosmetics",
    "home",
    "restaurant",
    "entertainment",
    "delivery",
    "transport",
    "credit",
    "gifts",
    "clothing",
    "essentials",
    "income",
];

export const EditTransactionDialog = ({ transaction, open, onOpenChange, onSubmit }: Props) => {
    const t = useTranslations();

    const form = useForm<z.infer<typeof editTransactionSchema>>({
        resolver: zodResolver(editTransactionSchema),
        defaultValues: {
            value: transaction ? String(transaction.value) : "",
            categories: transaction?.categorie ?? "",
            date: transaction ? new Date(transaction.date) : new Date(),
            description: transaction?.description ?? "",
        },
        values: transaction
            ? {
                  value: String(transaction.value),
                  categories: transaction.categorie,
                  date: new Date(transaction.date),
                  description: transaction.description,
              }
            : undefined,
    });

    const handleSubmit = async (data: z.infer<typeof editTransactionSchema>) => {
        await onSubmit(data);
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Form {...form}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>edit</DialogTitle>
                            <DialogDescription>hint</DialogDescription>
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

                        {/* Категория */}
                        <FormField
                            control={form.control}
                            name="categories"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dialogs.category")}</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("dialogs.chooseCategory")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categoryKeys.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {t(`categories.${cat}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Дата */}
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
                                                        "w-[240px] pl-3 text-left font-normal",
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

                        {/* Описание */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dialogs.description")}</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="resize-none" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive">{t("dialogs.cancel")}</Button>
                            </DialogClose>
                            <Button type="submit">save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
