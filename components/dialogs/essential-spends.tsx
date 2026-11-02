"use client";

import { useForm } from "react-hook-form";
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
import { Checkbox } from "components/ui/checkbox";
import { FormPanel, ListDialogBody, ListPanel, ListRow } from "ui/list-dialog";
import { useTranslations } from "next-intl";
import { EssentialsType } from "constants/index";
import { toast } from "react-toastify";
import { useNewEssential, useRemoveEssential, useSetEssentialPayments, useUpdateEssential } from "api/main";
import { v4 as uuidv4 } from "uuid";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { toMoneyInput } from "lib/money";
import { essentialSpendsFormSchema } from "schemas/other";
import { useValidationMessages } from "lib/validation";
import { getCurrencySymbol } from "lib/currency";
import { ListAction, subscribeListAction } from "lib/list-actions";

import { useEffect, useMemo, useRef, useState } from "react";
import { EssentialType } from "types/transactions";
import { EssentialPaymentDialog } from "./essential-payment";
import { EssentialCategoryField, useCategorySuggestion } from "components/essential-category-field";
import { getCategoryLabel } from "constants/categories";
import { suggestEssentialCategory } from "lib/essential-category";

const getEmptyEssentialValues = () => ({ amount: "", title: "", category: "" });

type Props = {
    nextMonth?: boolean;
    triggerLabel?: string;
};

export const EssentialSpends = ({ nextMonth, triggerLabel }: Props) => {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedEssential, setSelectedEssential] = useState<EssentialType | null>(null);
    const store = useStore();
    const userCurrency = store.userCurrency;

    const t = useTranslations();

    const { mutateAsync: essentialPaymentsAsync, isPending: essentialPaymentsPending } = useSetEssentialPayments();
    const { mutateAsync: removeEssentialAsync, isPending: removeEssentialPending } = useRemoveEssential();
    const { mutateAsync: newEssentialAsync, isPending: newEssentialPending } = useNewEssential();
    const { mutateAsync: updateEssentialAsync, isPending: updateEssentialPending } = useUpdateEssential();

    const apiPendings =
        essentialPaymentsPending || removeEssentialPending || newEssentialPending || updateEssentialPending;

    const arrayEssentials = nextMonth ? store.nextMonthEssentialsArray : store.essentialsArray;
    const listTotal = arrayEssentials.reduce((sum, { amount }) => sum + amount, 0);

    const validationMessages = useValidationMessages();
    const formSchema = useMemo(() => essentialSpendsFormSchema(validationMessages), [validationMessages]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyEssentialValues(),
    });
    const { setTouched } = useCategorySuggestion(form);
    const tCategories = useTranslations("categories");

    const editingEssential = editingId ? arrayEssentials.find(({ id }) => id === editingId) : undefined;
    const editingPaid = Boolean(editingEssential?.checked);
    const uncategorized = arrayEssentials.filter(
        (item) => !item.category && suggestEssentialCategory(item.title) !== null,
    );

    const setList = (items: EssentialType[]) => {
        if (nextMonth) store.setNextMonthEssentialsArray(items);
        else store.setEssentialsArray(items);
    };

    const resetForm = () => {
        setEditingId(null);
        setTouched(false);
        form.reset(getEmptyEssentialValues());
    };

    const startEditing = (essential: EssentialType) => {
        setEditingId(essential.id);
        setTouched(Boolean(essential.category));
        form.reset(
            {
                amount: toMoneyInput(essential.amount),
                title: essential.title,
                category: essential.category ?? "",
            },
            { keepDefaultValues: true },
        );
    };

    const categorizeAll = async () => {
        try {
            const type = nextMonth ? EssentialsType.NEXT_MONTH : EssentialsType.THIS_MONTH;
            for (const item of uncategorized) {
                const res = await updateEssentialAsync({
                    type,
                    item: { ...item, category: suggestEssentialCategory(item.title) ?? undefined },
                });
                setList(res.updatedItems);
                if (res.updatedTransactions) store.setTransactions(res.updatedTransactions);
            }
            toast.success(t("listDialog.categorized", { count: uncategorized.length }));
        } catch (error) {
            console.error(error);
            toast.error(t("dialogs.occurred"));
        }
    };

    const setDefaultsEssentials = async () => {
        try {
            if (store.defaultEssentialsArray.length <= 0) {
                toast.error(t("dialogs.essentials.noStandardPayments"));
                return;
            }

            if (nextMonth && store.nextMonthEssentialsArray.length > 0) {
                toast.error(t("dialogs.essentials.standardFillWarning"));
                return;
            }
            if (!nextMonth && store.essentialsArray.length > 0) {
                toast.error(t("dialogs.essentials.standardFillWarning"));
                return;
            }

            if (nextMonth) {
                const type = EssentialsType.NEXT_MONTH;
                const res = await essentialPaymentsAsync({
                    type,
                    items: store.defaultEssentialsArray,
                });
                store.setNextMonthEssentialsArray(res.updatedItems);
            } else {
                const type = EssentialsType.THIS_MONTH;
                const res = await essentialPaymentsAsync({
                    type,
                    items: store.defaultEssentialsArray,
                });
                store.setEssentialsArray(res.updatedItems);
            }

            toast.success(t("dialogs.essentials.standardValuesAdded"));
        } catch (error) {
            console.error(error);
            toast.error(t("dialogs.occurred"));
        }
    };

    const removeEssential = async (id: string) => {
        try {
            if (nextMonth) {
                const type = EssentialsType.NEXT_MONTH;
                const res = await removeEssentialAsync({ type, id });
                store.setNextMonthEssentialsArray(res.updatedItems);
            } else {
                const type = EssentialsType.THIS_MONTH;
                const res = await removeEssentialAsync({ type, id });
                store.setEssentialsArray(res.updatedItems);
            }

            if (editingId === id) resetForm();
            toast.success(t("dialogs.essentials.removed"));
        } catch (error) {
            console.error(error);
            toast.error(t("dialogs.occurred"));
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (editingId) {
                const essential = arrayEssentials.find(({ id }) => id === editingId);

                if (!essential) {
                    resetForm();
                    toast.error(t("dialogs.occurred"));
                    return;
                }

                const type = nextMonth ? EssentialsType.NEXT_MONTH : EssentialsType.THIS_MONTH;
                const res = await updateEssentialAsync({
                    type,
                    item: {
                        ...essential,
                        title: essential.checked ? essential.title : values.title,
                        amount: essential.checked ? essential.amount : Number(values.amount),
                        category: values.category || undefined,
                    },
                });

                setList(res.updatedItems);
                if (res.updatedTransactions) store.setTransactions(res.updatedTransactions);

                resetForm();
                return;
            }

            const item = {
                id: uuidv4(),
                title: values.title || "",
                amount: Number(values.amount) || 0,
                checked: false,
                ...(values.category ? { category: values.category } : {}),
            };
            if (nextMonth) {
                const type = EssentialsType.NEXT_MONTH;
                const res = await newEssentialAsync({ type, item });
                store.setNextMonthEssentialsArray(res.updatedItems);
            } else {
                const type = EssentialsType.THIS_MONTH;
                const res = await newEssentialAsync({ type, item });
                store.setEssentialsArray(res.updatedItems);
            }

            resetForm();
        } catch (error) {
            console.error(error);
            toast.error(t("dialogs.occurred"));
        }
    };

    const paymentType = nextMonth ? EssentialsType.NEXT_MONTH : EssentialsType.THIS_MONTH;

    const listActionRef = useRef<(action: ListAction, id: string) => void>(() => {});
    listActionRef.current = (action, id) => {
        const essential = arrayEssentials.find((item) => item.id === id);
        if (!essential) return;
        if (action === "remove") {
            removeEssential(id);
            return;
        }
        setOpen(true);
        startEditing(essential);
    };

    useEffect(
        () =>
            subscribeListAction(nextMonth ? "nextMonthEssentials" : "essentials", (action, id) =>
                listActionRef.current(action, id),
            ),
        [nextMonth],
    );

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);
                    if (!nextOpen) resetForm();
                }}
            >
                <Form {...form}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            {triggerLabel ??
                                (nextMonth ? t("dialogs.essentials.nextMonth") : t("dialogs.essentials.title"))}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="lg:max-w-dialog-wide">
                        <DialogHeader>
                            <DialogTitle>
                                {nextMonth ? t("dialogs.essentials.nextMonth") : t("dialogs.essentials.title")}
                            </DialogTitle>
                            <DialogDescription>{t("dialogs.essentials.hint")}</DialogDescription>
                        </DialogHeader>
                        <ListDialogBody>
                            <ListPanel
                                label={t("listDialog.items")}
                                summary={
                                    arrayEssentials.length > 0 &&
                                    `${arrayEssentials.length} · ${formatCurrency(listTotal)} ${getCurrencySymbol(userCurrency)}`
                                }
                                isEmpty={arrayEssentials.length === 0}
                                toolbar={
                                    uncategorized.length > 0 && (
                                        <>
                                            <span className="text-ink-faint text-xs">
                                                {t("listDialog.uncategorized", { count: uncategorized.length })}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={categorizeAll}
                                                disabled={apiPendings}
                                            >
                                                {t("listDialog.categorize")}
                                            </Button>
                                        </>
                                    )
                                }
                                empty={
                                    <>
                                        <p className="text-ink-faint text-sm">{t("listDialog.empty")}</p>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={setDefaultsEssentials}
                                            disabled={apiPendings}
                                        >
                                            {t("dialogs.essentials.fillStandard")}
                                        </Button>
                                    </>
                                }
                            >
                                {arrayEssentials.map((essential) => {
                                    const { id, title, amount, checked } = essential;
                                    return (
                                        <ListRow
                                            key={id}
                                            htmlFor={nextMonth && !checked ? undefined : id}
                                            leading={
                                                nextMonth && !checked ? undefined : (
                                                    <Checkbox
                                                        id={id}
                                                        checked={checked}
                                                        onCheckedChange={() => setSelectedEssential(essential)}
                                                    />
                                                )
                                            }
                                            title={title}
                                            meta={`${formatCurrency(checked ? (essential.paidAmount ?? amount) : amount)} ${getCurrencySymbol(userCurrency)} · ${getCategoryLabel(essential.category || "essentials", tCategories)}`}
                                            muted={checked}
                                            copyValue={toMoneyInput(
                                                checked ? (essential.paidAmount ?? amount) : amount,
                                            )}
                                            active={editingId === id}
                                            disabled={apiPendings}
                                            removeDisabled={checked}
                                            editLabel={t("listDialog.edit")}
                                            removeLabel={t("listDialog.remove")}
                                            onEdit={() => startEditing(essential)}
                                            onRemove={() => removeEssential(id)}
                                        />
                                    );
                                })}
                            </ListPanel>
                            <FormPanel label={editingId ? t("listDialog.editing") : t("listDialog.newItem")}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("dialogs.essentials.label")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t("dialogs.essentials.placeholder")}
                                                        disabled={editingPaid}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("dialogs.amount")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        inputMode="decimal"
                                                        placeholder="0.00"
                                                        disabled={editingPaid}
                                                        {...field}
                                                        onChange={handleDecimalInputChange(field.onChange)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <EssentialCategoryField form={form} onPick={() => setTouched(true)} />
                                    {editingPaid && (
                                        <p className="text-ink-faint font-mono text-2xs">
                                            {t("listDialog.paidLocked")}
                                        </p>
                                    )}
                                    <DialogFooter>
                                        {editingId ? (
                                            <Button type="button" variant="secondary" onClick={resetForm}>
                                                {t("dialogs.cancel")}
                                            </Button>
                                        ) : (
                                            <DialogClose asChild>
                                                <Button type="button" variant="secondary">
                                                    {t("dialogs.cancel")}
                                                </Button>
                                            </DialogClose>
                                        )}
                                        <Button disabled={apiPendings || !form.formState.isValid} type="submit">
                                            {editingId ? t("dialogs.setTotal.save") : t("dialogs.submit")}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </FormPanel>
                        </ListDialogBody>
                    </DialogContent>
                </Form>
            </Dialog>
            <EssentialPaymentDialog
                essential={selectedEssential}
                type={paymentType}
                open={Boolean(selectedEssential)}
                onOpenChange={(open) => {
                    if (!open) setSelectedEssential(null);
                }}
            />
        </>
    );
};
