"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { PencilIcon, XIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

import { useAddExpectedIncome, useRemoveExpectedIncome, useUpdateExpectedIncome } from "api/main";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { toMoneyInput } from "lib/money";
import { expectedIncomeFormSchema } from "schemas/other";
import useStore from "store/general";
import { ExpectedIncome } from "types/transactions";
import { Button } from "ui/button";
import { Checkbox } from "components/ui/checkbox";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

type FormValues = z.infer<typeof expectedIncomeFormSchema>;

const getEmptyValues = (): FormValues => ({ amount: "", title: "", day: "", recurring: true });

export const ExpectedIncomeDialog = ({ triggerLabel }: { triggerLabel?: string }) => {
    const t = useTranslations("expectedIncome");
    const store = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);

    const { mutateAsync: addIncome, isPending: adding } = useAddExpectedIncome();
    const { mutateAsync: updateIncome, isPending: updating } = useUpdateExpectedIncome();
    const { mutateAsync: removeIncome, isPending: removing } = useRemoveExpectedIncome();
    const pending = adding || updating || removing;

    const symbol = getCurrencySymbol(store.userCurrency);

    const form = useForm<FormValues>({
        resolver: zodResolver(expectedIncomeFormSchema),
        defaultValues: getEmptyValues(),
    });

    const resetForm = () => {
        setEditingId(null);
        form.reset(getEmptyValues());
    };

    const startEditing = (income: ExpectedIncome) => {
        setEditingId(income.id);
        form.reset(
            {
                amount: toMoneyInput(income.amount),
                title: income.title,
                day: String(income.day),
                recurring: income.recurring,
            },
            { keepDefaultValues: true },
        );
    };

    const remove = async (id: string) => {
        try {
            const res = await removeIncome(id);
            store.setExpectedIncomes(res.updatedItems);
            if (editingId === id) resetForm();
            toast.success(t("removed"));
        } catch {}
    };

    const onSubmit = async (values: FormValues) => {
        const item = {
            id: editingId ?? uuidv4(),
            title: values.title.trim(),
            amount: Number(values.amount),
            day: Number(values.day),
            recurring: values.recurring,
        };

        try {
            const res = editingId ? await updateIncome({ item }) : await addIncome({ item });
            store.setExpectedIncomes(res.updatedItems);
            toast.success(t(editingId ? "updated" : "added"));
            resetForm();
        } catch {}
    };

    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) resetForm();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="secondary" className="h-fit">
                    {triggerLabel ?? t("title")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("dialogDescription")}</DialogDescription>
                </DialogHeader>

                {store.expectedIncomes.length > 0 && (
                    <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
                        {store.expectedIncomes.map((income) => (
                            <li
                                key={income.id}
                                className={twMerge(
                                    "border-border/70 bg-muted/25 flex items-center gap-3 rounded-xl border px-3 py-2.5",
                                    editingId === income.id && "border-indigo-500/60",
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{income.title}</p>
                                    <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                                        {formatCurrency(income.amount)} {symbol} · {t("onDay", { day: income.day })}
                                        {!income.recurring && ` · ${t("oneOff")}`}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={pending || income.received}
                                        onClick={() => startEditing(income)}
                                        className="text-muted-foreground hover:text-foreground size-8 rounded-lg p-0"
                                        aria-label={t("edit")}
                                    >
                                        <PencilIcon className="size-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={pending || income.received}
                                        onClick={() => remove(income.id)}
                                        className="text-muted-foreground size-8 rounded-lg p-0 hover:bg-red-500/10 hover:text-red-500"
                                        aria-label={t("remove")}
                                    >
                                        <XIcon className="size-3.5" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-[1fr_6.5rem] gap-3">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("amountLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="decimal"
                                                placeholder="40000"
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
                                name="day"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("dayLabel")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="numeric"
                                                placeholder="15"
                                                {...field}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    if (
                                                        value === "" ||
                                                        (/^\d{1,2}$/.test(value) &&
                                                            Number(value) >= 1 &&
                                                            Number(value) <= 31)
                                                    ) {
                                                        field.onChange(value);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("titleLabel")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("titlePlaceholder")} maxLength={80} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="recurring"
                            render={({ field }) => (
                                <FormItem className="border-border/70 flex items-start gap-3 rounded-xl border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                            className="mt-0.5"
                                        />
                                    </FormControl>
                                    <div className="space-y-1">
                                        <FormLabel className="cursor-pointer">{t("recurring")}</FormLabel>
                                        <p className="text-muted-foreground text-xs">{t("recurringHint")}</p>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            {editingId ? (
                                <Button type="button" variant="secondary" onClick={resetForm}>
                                    {t("cancel")}
                                </Button>
                            ) : (
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        {t("cancel")}
                                    </Button>
                                </DialogClose>
                            )}
                            <Button type="submit" disabled={pending}>
                                {editingId ? t("save") : t("submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
