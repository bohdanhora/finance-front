"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { useAddSavingsOperation } from "api/main";
import { CURRENCY } from "constants/index";
import useStore from "store/general";
import useBankStore from "store/bank";
import { SavingsOperation, SavingsOperationType, SavingsStorage } from "types/transactions";
import { Button } from "components/ui/button";
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
import { DatePicker } from "components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Textarea } from "components/ui/textarea";
import { convertSavingsCurrency, getSavingsNativeBalance } from "lib/savings";
import { formatCurrency } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";

const operationSchema = z
    .object({
        type: z.nativeEnum(SavingsOperationType),
        storage: z.nativeEnum(SavingsStorage),
        destinationStorage: z.nativeEnum(SavingsStorage),
        amount: z.string().refine((value) => Number(value) > 0),
        currency: z.nativeEnum(CURRENCY),
        date: z.string().min(1),
        note: z.string().max(160),
    })
    .refine((values) => values.type !== SavingsOperationType.TRANSFER || values.storage !== values.destinationStorage, {
        path: ["destinationStorage"],
    });

type OperationFormValues = z.infer<typeof operationSchema>;

const getEmptyValues = (currency: CURRENCY): OperationFormValues => ({
    type: SavingsOperationType.DEPOSIT,
    storage: SavingsStorage.CARD,
    destinationStorage: SavingsStorage.CASH,
    amount: "",
    currency,
    date: dayjs().format("YYYY-MM-DD"),
    note: "",
});

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const SavingsOperationDialog = ({ open, onOpenChange }: Props) => {
    const t = useTranslations("savings");
    const tNav = useTranslations("navbar");
    const userCurrency = useStore((state) => state.userCurrency);
    const setSavingsGoals = useStore((state) => state.setSavingsGoals);
    const setSavingsOperations = useStore((state) => state.setSavingsOperations);
    const store = useStore();
    const usdToUah = useBankStore((state) => state.usd?.rateBuy ?? 0);
    const eurToUah = useBankStore((state) => state.eur?.rateBuy ?? 0);
    const { mutateAsync: addOperation, isPending } = useAddSavingsOperation();

    const form = useForm<OperationFormValues>({
        resolver: zodResolver(operationSchema),
        mode: "onChange",
        defaultValues: getEmptyValues(userCurrency),
    });

    useEffect(() => {
        if (!open) return;
        form.reset(getEmptyValues(userCurrency));
    }, [form, open, userCurrency]);

    const type = form.watch("type");
    const storage = form.watch("storage");
    const destinationStorage = form.watch("destinationStorage");
    const amount = Number(form.watch("amount")) || 0;
    const currency = form.watch("currency");
    const rates = useMemo(() => ({ usdToUah, eurToUah }), [eurToUah, usdToUah]);
    const convertedBalanceAmount =
        type === SavingsOperationType.TRANSFER ? amount : convertSavingsCurrency(amount, currency, userCurrency, rates);
    const balanceAmount = convertedBalanceAmount === null ? null : Math.round(convertedBalanceAmount * 100) / 100;
    const availableInStorage = getSavingsNativeBalance(store.savingsOperations, currency, storage);
    const exceedsStorage =
        type !== SavingsOperationType.DEPOSIT && amount > 0 && availableInStorage + Number.EPSILON < amount;
    const exceedsMainBalance =
        type === SavingsOperationType.DEPOSIT &&
        balanceAmount !== null &&
        balanceAmount > store.totalAmount + Number.EPSILON;
    const conversionUnavailable = type !== SavingsOperationType.TRANSFER && amount > 0 && balanceAmount === null;

    const displayMoney = (value: number, selectedCurrency: CURRENCY) =>
        `${formatCurrency(value)} ${getCurrencySymbol(selectedCurrency)}`;

    useEffect(() => {
        if (type === SavingsOperationType.TRANSFER && destinationStorage === storage) {
            form.setValue(
                "destinationStorage",
                storage === SavingsStorage.CARD ? SavingsStorage.CASH : SavingsStorage.CARD,
                { shouldValidate: true },
            );
        }
    }, [destinationStorage, form, storage, type]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) form.reset(getEmptyValues(userCurrency));
        onOpenChange(nextOpen);
    };

    const onSubmit = async (values: OperationFormValues) => {
        const nativeAvailable = getSavingsNativeBalance(store.savingsOperations, values.currency, values.storage);
        const convertedAmount =
            values.type === SavingsOperationType.TRANSFER
                ? Number(values.amount)
                : convertSavingsCurrency(Number(values.amount), values.currency, userCurrency, rates);

        if (values.type !== SavingsOperationType.TRANSFER && convertedAmount === null) {
            form.setError("amount", { message: t("conversionUnavailable") });
            return;
        }

        if (values.type === SavingsOperationType.DEPOSIT && convertedAmount! > store.totalAmount) {
            form.setError("amount", { message: t("notEnoughOnBalance") });
            return;
        }

        if (values.type !== SavingsOperationType.DEPOSIT && Number(values.amount) > nativeAvailable) {
            form.setError("amount", { message: t("notEnoughInStorage") });
            return;
        }

        const item: SavingsOperation = {
            id: uuidv4(),
            type: values.type,
            storage: values.storage,
            destinationStorage: values.type === SavingsOperationType.TRANSFER ? values.destinationStorage : undefined,
            amount: Number(values.amount),
            currency: values.currency,
            date: new Date(`${values.date}T12:00:00.000Z`).toISOString(),
            note: values.note.trim() || undefined,
        };

        try {
            const response = await addOperation({
                item,
                balanceAmount:
                    values.type === SavingsOperationType.TRANSFER
                        ? undefined
                        : Math.round(convertedAmount! * 100) / 100,
            });
            setSavingsGoals(response.updatedGoals);
            setSavingsOperations(response.updatedOperations);
            if (response.updatedTransactions) store.setTransactions(response.updatedTransactions);
            if (response.updatedTotals) {
                store.setTotalAmount(response.updatedTotals.totalAmount);
                store.setTotalIncome(response.updatedTotals.totalIncome);
                store.setTotalSpend(response.updatedTotals.totalSpend);
            }
            toast.success(t("operationSaved"));
            handleOpenChange(false);
        } catch {
            // The shared API error handler already shows the server message.
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("newOperation")}</DialogTitle>
                            <DialogDescription>{t("operationDialogHint")}</DialogDescription>
                        </DialogHeader>

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("operationType")}</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(SavingsOperationType).map((value) => (
                                                <SelectItem key={value} value={value}>
                                                    {t(value)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="storage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {type === SavingsOperationType.TRANSFER ? t("fromStorage") : t("storage")}
                                        </FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(SavingsStorage).map((value) => (
                                                    <SelectItem key={value} value={value}>
                                                        {t(value)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {type === SavingsOperationType.TRANSFER ? (
                                <FormField
                                    control={form.control}
                                    name="destinationStorage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("toStorage")}</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(SavingsStorage)
                                                        .filter((value) => value !== storage)
                                                        .map((value) => (
                                                            <SelectItem key={value} value={value}>
                                                                {t(value)}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("date")}</FormLabel>
                                            <FormControl>
                                                <DatePicker value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {type === SavingsOperationType.TRANSFER && (
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("date")}</FormLabel>
                                        <FormControl>
                                            <DatePicker value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("amount")}</FormLabel>
                                    <FormControl>
                                        <Input inputMode="decimal" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("currency")}</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(CURRENCY).map((currency) => (
                                                <SelectItem key={currency} value={currency}>
                                                    {tNav(currency)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {amount > 0 && (
                            <div
                                className={
                                    exceedsStorage || exceedsMainBalance || conversionUnavailable
                                        ? "rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] p-3 text-sm"
                                        : "rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-3 text-sm"
                                }
                            >
                                {type !== SavingsOperationType.DEPOSIT && (
                                    <p className="font-medium">
                                        {t("availableInStorage", {
                                            amount: displayMoney(availableInStorage, currency),
                                        })}
                                    </p>
                                )}
                                {conversionUnavailable ? (
                                    <p className="text-rose-600 dark:text-rose-400">{t("conversionUnavailable")}</p>
                                ) : type === SavingsOperationType.DEPOSIT ? (
                                    <p className={exceedsMainBalance ? "text-rose-600 dark:text-rose-400" : ""}>
                                        {exceedsMainBalance
                                            ? t("notEnoughOnBalance")
                                            : t("depositBalanceImpact", {
                                                  amount: displayMoney(balanceAmount ?? 0, userCurrency),
                                              })}
                                    </p>
                                ) : type === SavingsOperationType.WITHDRAWAL ? (
                                    <p className={exceedsStorage ? "text-rose-600 dark:text-rose-400" : ""}>
                                        {exceedsStorage
                                            ? t("notEnoughInStorage")
                                            : t("withdrawalBalanceImpact", {
                                                  amount: displayMoney(balanceAmount ?? 0, userCurrency),
                                              })}
                                    </p>
                                ) : (
                                    exceedsStorage && (
                                        <p className="text-rose-600 dark:text-rose-400">{t("notEnoughInStorage")}</p>
                                    )
                                )}
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("note")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            className="min-h-20 resize-none"
                                            placeholder={t("notePlaceholder")}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    {t("cancel")}
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={
                                    isPending ||
                                    !form.formState.isValid ||
                                    exceedsStorage ||
                                    exceedsMainBalance ||
                                    conversionUnavailable
                                }
                            >
                                {t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
