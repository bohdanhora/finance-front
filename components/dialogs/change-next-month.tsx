"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { PlusIcon, XIcon } from "lucide-react";

import { useTranslations } from "next-intl";
import { useSetNextMonthTotalAmount } from "api/main";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { roundMoney } from "lib/money";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { changeNextMonthFormSchema } from "schemas/other";
import { useValidationMessages } from "lib/validation";
import { CURRENCY } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { convertToUserCurrency } from "lib/expected-income";
import { useExchangeRates } from "hooks/use-exchange-rates";
import { ViewSwitcher } from "components/charts/view-switcher";

type FormValues = z.infer<ReturnType<typeof changeNextMonthFormSchema>>;
type PaymentValues = FormValues["payments"][number];

const getEmptyPayment = (currency: CURRENCY): PaymentValues => ({
    mode: "fixed",
    amount: "",
    rate: "",
    hours: "",
    currency,
});

const paymentTotal = (payment: PaymentValues) =>
    payment.mode === "rate"
        ? (Number(payment.rate) || 0) * (Number(payment.hours) || 0)
        : Number(payment.amount) || 0;

export const ChangeNextMonthIncome = ({ triggerLabel }: { triggerLabel?: string }) => {
    const store = useStore();
    const rates = useExchangeRates();

    const userCurrency = useStore((state) => state.userCurrency);
    const symbol = getCurrencySymbol(userCurrency);

    const { mutateAsync: setNextMonthAmountAsync, isPending } = useSetNextMonthTotalAmount();
    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs");

    const getEmptyValues = (): FormValues => ({ payments: [getEmptyPayment(userCurrency)] });

    const validationMessages = useValidationMessages();
    const formSchema = useMemo(() => changeNextMonthFormSchema(validationMessages), [validationMessages]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyValues(),
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "payments" });
    const payments = useWatch({ control: form.control, name: "payments" }) ?? [];

    const convertedTotals = payments.map((payment) =>
        convertToUserCurrency(paymentTotal(payment), payment.currency, userCurrency, rates),
    );
    const conversionUnavailable = convertedTotals.some((value) => value === null);
    const total = roundMoney(convertedTotals.reduce<number>((sum, value) => sum + (value ?? 0), 0));

    const handleOpenChange = (nextOpen: boolean) => {
        form.reset(getEmptyValues());
        setOpen(nextOpen);
    };

    const onSubmit = async () => {
        if (conversionUnavailable) {
            toast.error(t("conversionUnavailable"));
            return;
        }

        try {
            store.setNextMonthTotalAmount(total);

            await setNextMonthAmountAsync({
                nextMonthTotalAmount: total,
            });

            handleOpenChange(false);

            toast.success(
                tGlobal("toasts.nextMonthIcomeChanged", {
                    amount: formatCurrency(total),
                    currency: symbol,
                }),
            );
        } catch (error) {
            console.error(t("changeNextMonthIncomeRequestError"), error);
            toast.error(t("changeNextMonthIncomeError"));
        }
    };

    const decimalField = (name: `payments.${number}.${"amount" | "rate" | "hours"}`, label: string) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="min-w-0 flex-1">
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input
                            inputMode="decimal"
                            placeholder="0"
                            {...field}
                            onChange={handleDecimalInputChange(field.onChange)}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        {triggerLabel ?? t("changeNextMonthIncome")}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("expectedIncome")}</DialogTitle>
                            <DialogDescription>{t("nextMonthIncomeHint")}</DialogDescription>
                        </DialogHeader>

                        <ul className="max-h-96 space-y-3 overflow-y-auto">
                            {fields.map((item, index) => {
                                const payment = payments[index] ?? item;
                                const paymentSymbol = getCurrencySymbol(payment.currency);
                                const subtotal = paymentTotal(payment);

                                return (
                                    <li key={item.id} className="border-rule space-y-3 border p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-ink-faint font-mono text-2xs uppercase">
                                                {t("paymentNumber", { number: index + 1 })}
                                            </span>
                                            <ViewSwitcher
                                                className="ml-auto"
                                                value={payment.mode}
                                                onChange={(mode) =>
                                                    form.setValue(`payments.${index}.mode`, mode, {
                                                        shouldValidate: form.formState.isSubmitted,
                                                    })
                                                }
                                                options={[
                                                    { value: "fixed", label: t("fixed") },
                                                    { value: "rate", label: t("byRate") },
                                                ]}
                                            />
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => remove(index)}
                                                    className="text-ink-faint size-8 shrink-0 p-0 hover:bg-signal-wash hover:text-signal"
                                                    aria-label={t("removePayment")}
                                                >
                                                    <XIcon className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            {payment.mode === "rate" ? (
                                                <>
                                                    {decimalField(`payments.${index}.rate`, t("rate"))}
                                                    {decimalField(`payments.${index}.hours`, t("hours"))}
                                                </>
                                            ) : (
                                                decimalField(`payments.${index}.amount`, t("fixedAmount"))
                                            )}
                                            <FormField
                                                control={form.control}
                                                name={`payments.${index}.currency`}
                                                render={({ field }) => (
                                                    <FormItem className="w-20 shrink-0">
                                                        <FormLabel>{t("currency")}</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger
                                                                    className="w-full"
                                                                    aria-label={t("currency")}
                                                                >
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {Object.values(CURRENCY).map((value) => (
                                                                    <SelectItem value={value} key={value}>
                                                                        {getCurrencySymbol(value)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {subtotal > 0 && (payment.mode === "rate" || payment.currency !== userCurrency) && (
                                            <p className="text-ink-faint font-mono text-2xs tabular-nums">
                                                = {formatCurrency(subtotal)} {paymentSymbol}
                                                {payment.currency !== userCurrency &&
                                                    (convertedTotals[index] !== null
                                                        ? ` ≈ ${formatCurrency(convertedTotals[index]!)} ${symbol}`
                                                        : ` · ${t("rateUnavailable")}`)}
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => append(getEmptyPayment(userCurrency))}
                        >
                            <PlusIcon className="size-3.5" />
                            {t("addPayment")}
                        </Button>

                        <div className="border-rule-strong flex items-baseline justify-between gap-4 border-t pt-4">
                            <span className="text-ink-faint font-mono text-2xs uppercase">{t("total")}</span>
                            <span className="font-display text-xl font-semibold tabular-nums">
                                {formatCurrency(total)} {symbol}
                            </span>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">{t("cancel")}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isPending || total <= 0}>
                                {t("submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
