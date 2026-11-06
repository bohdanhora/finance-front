"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import { useAddExpectedIncome, useRemoveExpectedIncome, useUpdateExpectedIncome } from "api/main";
import { CURRENCY } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { convertToUserCurrency, isForeignAmount } from "lib/foreign-amount";
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
import { ListAction, subscribeListAction } from "lib/list-actions";
import { ClearListButton, FormPanel, ListDialogBody, ListPanel, ListRow } from "ui/list-dialog";

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
    const tl = useTranslations("listDialog");
    const store = useStore();
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);

    const { mutateAsync: addIncome, isPending: adding } = useAddExpectedIncome();
    const { mutateAsync: updateIncome, isPending: updating } = useUpdateExpectedIncome();
    const { mutateAsync: removeIncome, isPending: removing } = useRemoveExpectedIncome();
    const pending = clearing || adding || updating || removing;

    const symbol = getCurrencySymbol(store.userCurrency);
    const listTotal = store.expectedIncomes.reduce((sum, { amount }) => sum + amount, 0);
    const removable = store.expectedIncomes.filter(({ received }) => !received);
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
        const foreign = isForeignAmount(income, store.userCurrency);
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

    const clearAll = async () => {
        const keepsReceived = removable.length < store.expectedIncomes.length;
        resetForm();
        setClearing(true);
        try {
            for (const { id } of removable) {
                const res = await removeIncome(id);
                store.setExpectedIncomes(res.updatedItems);
            }
            toast.success(tl(keepsReceived ? "clearedKeptReceived" : "cleared"));
        } catch {
        } finally {
            setClearing(false);
        }
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

    const listActionRef = useRef<(action: ListAction, id: string) => void>(() => {});
    listActionRef.current = (action, id) => {
        const income = store.expectedIncomes.find((item) => item.id === id);
        if (!income) return;
        if (action === "remove") {
            remove(id);
            return;
        }
        setOpen(true);
        startEditing(income);
    };

    useEffect(() => subscribeListAction("expectedIncome", (action, id) => listActionRef.current(action, id)), []);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) resetForm();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    {triggerLabel ?? t("title")}
                </Button>
            </DialogTrigger>
            <DialogContent className="lg:max-w-dialog-wide">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("dialogDescription")}</DialogDescription>
                </DialogHeader>
                <ListDialogBody>
                    <ListPanel
                        label={tl("items")}
                        summary={
                            store.expectedIncomes.length > 0 &&
                            `${store.expectedIncomes.length} · ${formatCurrency(listTotal)} ${symbol}`
                        }
                        action={
                            removable.length > 0 && (
                                <ClearListButton
                                    label={tl("clearAll")}
                                    confirmLabel={tl("clearConfirm", { count: removable.length })}
                                    disabled={pending}
                                    onClear={clearAll}
                                />
                            )
                        }
                        isEmpty={store.expectedIncomes.length === 0}
                        empty={<p className="text-ink-faint text-sm">{tl("empty")}</p>}
                    >
                        {store.expectedIncomes.map((income) => (
                            <ListRow
                                key={income.id}
                                title={income.title}
                                meta={`${isForeignAmount(income, store.userCurrency) ? `${formatCurrency(income.currencyAmount)} ${getCurrencySymbol(income.currency)} ≈ ` : ""}${formatCurrency(income.amount)} ${symbol} · ${t("onDay", { day: income.day })}${income.recurring ? "" : ` · ${t("oneOff")}`}`}
                                muted={income.received}
                                copyValue={toMoneyInput(income.amount)}
                                active={editingId === income.id}
                                disabled={pending || income.received}
                                editLabel={t("edit")}
                                removeLabel={t("remove")}
                                onEdit={() => startEditing(income)}
                                onRemove={() => remove(income.id)}
                            />
                        ))}
                    </ListPanel>
                    <FormPanel label={editingId ? tl("editing") : tl("newItem")}>
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
                                                        <SelectTrigger
                                                            className="w-full"
                                                            aria-label={t("currencyLabel")}
                                                        >
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
                                            ? t("convertedPreview", {
                                                  amount: formatCurrency(convertedPreview),
                                                  currency: symbol,
                                              })
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
                    </FormPanel>
                </ListDialogBody>
            </DialogContent>
        </Dialog>
    );
};
