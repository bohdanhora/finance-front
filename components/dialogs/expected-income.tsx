"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { PencilIcon, XIcon } from "lucide-react";
import { twMerge } from "lib/tw";
import { v4 as uuidv4 } from "uuid";

import { useAddExpectedIncome, useRemoveExpectedIncome, useUpdateExpectedIncome } from "api/main";
import { CURRENCY } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { convertToUserCurrency, isForeignIncome } from "lib/expected-income";
import { useExchangeRates } from "hooks/use-exchange-rates";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { toMoneyInput } from "lib/money";
import { expectedIncomeFormSchema } from "schemas/other";
import { useValidationMessages } from "lib/validation";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Hint } from "components/hint";

type FormValues = z.infer<ReturnType<typeof expectedIncomeFormSchema>>;

const getEmptyValues = (currency: CURRENCY): FormValues => ({
    amount: "",
    title: "",
    day: "",
    recurring: true,
    currency,
});

export const ExpectedIncomeDialog = ({ triggerLabel }: { triggerLabel?: string }) => {
    const t = useTranslations("expectedIncome");
    const store = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);

    const { mutateAsync: addIncome, isPending: adding } = useAddExpectedIncome();
    const { mutateAsync: updateIncome, isPending: updating } = useUpdateExpectedIncome();
    const { mutateAsync: removeIncome, isPending: removing } = useRemoveExpectedIncome();
    const pending = adding || updating || removing;

    const symbol = getCurrencySymbol(store.userCurrency);
    const rates = useExchangeRates();

    const validationMessages = useValidationMessages();
    const formSchema = useMemo(() => expectedIncomeFormSchema(validationMessages), [validationMessages]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyValues(store.userCurrency),
    });

    const currency = form.watch("currency");
    const enteredAmount = Number(form.watch("amount")) || 0;
    const isForeign = currency !== store.userCurrency;
    const convertedPreview =
        isForeign && enteredAmount > 0
            ? convertToUserCurrency(enteredAmount, currency, store.userCurrency, rates)
            : null;

    const resetForm = () => {
        setEditingId(null);
        form.reset(getEmptyValues(store.userCurrency));
    };

    const startEditing = (income: ExpectedIncome) => {
        setEditingId(income.id);
        const foreign = isForeignIncome(income, store.userCurrency);
        form.reset(
            {
                amount: toMoneyInput(foreign ? income.currencyAmount! : income.amount),
                title: income.title,
                day: String(income.day),
                recurring: income.recurring,
                currency: foreign ? income.currency! : store.userCurrency,
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
        const foreign = values.currency !== store.userCurrency;
        const amount = foreign
            ? convertToUserCurrency(Number(values.amount), values.currency, store.userCurrency, rates)
            : Number(values.amount);

        if (amount === null) {
            form.setError("amount", { message: t("conversionUnavailable") });
            return;
        }

        const item = {
            id: editingId ?? uuidv4(),
            title: values.title.trim(),
            amount,
            day: Number(values.day),
            recurring: values.recurring,
            ...(foreign && { currency: values.currency, currencyAmount: Number(values.amount) }),
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
                <Button variant="outline" size="sm">
                    {triggerLabel ?? t("title")}
                </Button>
            </DialogTrigger>
            <DialogContent>
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
                                    "border-rule flex items-center gap-3 border-b py-2.5",
                                    editingId === income.id && "border-accent",
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{income.title}</p>
                                    <p className="text-ink-faint mt-0.5 text-xs tabular-nums">
                                        {isForeignIncome(income, store.userCurrency) &&
                                            `${formatCurrency(income.currencyAmount)} ${getCurrencySymbol(income.currency)} ≈ `}
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
                                        className="text-ink-faint hover:text-ink size-8 p-0"
                                        aria-label={t("edit")}
                                    >
                                        <PencilIcon className="size-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={pending || income.received}
                                        onClick={() => remove(income.id)}
                                        className="text-ink-faint size-8 p-0 hover:bg-signal-wash hover:text-signal"
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
                        <div className="flex gap-3">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem className="min-w-0 flex-1">
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
                                name="currency"
                                render={({ field }) => (
                                    <FormItem className="w-20 shrink-0">
                                        <FormLabel>{t("currencyLabel")}</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full" aria-label={t("currencyLabel")}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(CURRENCY).map((value) => (
                                                    <SelectItem key={value} value={value}>
                                                        {getCurrencySymbol(value)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="day"
                                render={({ field }) => (
                                    <FormItem className="w-24 shrink-0">
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
                        {isForeign && (
                            <p className="text-ink-faint -mt-2 font-mono text-2xs tabular-nums">
                                {convertedPreview !== null
                                    ? t("convertedPreview", { amount: formatCurrency(convertedPreview), currency: symbol })
                                    : t("foreignHint", { currency: symbol })}
                            </p>
                        )}
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
                                <FormItem className="border-rule flex items-center gap-3 border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                        />
                                    </FormControl>
                                    <FormLabel className="cursor-pointer font-sans text-sm tracking-normal normal-case text-ink">
                                        {t("recurring")}
                                    </FormLabel>
                                    <Hint text={t("recurringHint")} />
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
