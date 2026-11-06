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
import { useTranslations } from "next-intl";
import { useNewEssential, useRemoveEssential, useUpdateEssential } from "api/main";
import { ClearListButton, FormPanel, ListDialogBody, ListPanel, ListRow } from "ui/list-dialog";
import { v4 as uuidv4 } from "uuid";
import { EssentialsType } from "constants/index";
import { toast } from "react-toastify";
import { formatCurrency } from "lib/utils";
import { toMoneyInput } from "lib/money";
import { changeDefaultFormSchema } from "schemas/other";
import { useValidationMessages } from "lib/validation";
import { getCurrencySymbol } from "lib/currency";

import { useMemo, useState } from "react";
import { EssentialType } from "types/transactions";
import { EssentialCategoryField, useCategorySuggestion } from "components/essential-category-field";
import { getCategoryLabel } from "constants/categories";
import { suggestEssentialCategory } from "lib/essential-category";
import {
    EssentialAmountField,
    getEmptyEssentialValues,
    getEssentialFormValues,
} from "components/essential-amount-field";
import { useExchangeRates } from "hooks/use-exchange-rates";
import { isForeignAmount, toStoredMoney } from "lib/foreign-amount";

export const ChangeDefaultEssentials = ({ triggerLabel }: { triggerLabel?: string }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);
    const store = useStore();
    const userCurrency = store.userCurrency;
    const rates = useExchangeRates("sell");

    const arrayEssentials = store.defaultEssentialsArray;
    const listTotal = arrayEssentials.reduce((sum, { amount }) => sum + amount, 0);

    const { mutateAsync: newEssentialAsync, isPending: newEssentialPending } = useNewEssential();

    const { mutateAsync: removeEssentialAsync, isPending: removeEssentialPending } = useRemoveEssential();
    const { mutateAsync: updateEssentialAsync, isPending: updateEssentialPending } = useUpdateEssential();

    const pendings = clearing || removeEssentialPending || newEssentialPending || updateEssentialPending;

    const t = useTranslations("dialogs");
    const tl = useTranslations("listDialog");

    const validationMessages = useValidationMessages();
    const formSchema = useMemo(() => changeDefaultFormSchema(validationMessages), [validationMessages]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyEssentialValues(userCurrency),
    });
    const { setTouched } = useCategorySuggestion(form);
    const tCategories = useTranslations("categories");
    const uncategorized = arrayEssentials.filter(
        (item) => !item.category && suggestEssentialCategory(item.title) !== null,
    );

    const resetForm = () => {
        setEditingId(null);
        setTouched(false);
        form.reset(getEmptyEssentialValues(userCurrency));
    };

    const startEditing = (essential: EssentialType) => {
        setEditingId(essential.id);
        setTouched(Boolean(essential.category));
        form.reset(getEssentialFormValues(essential, userCurrency), { keepDefaultValues: true });
    };

    const categorizeAll = async () => {
        try {
            for (const item of uncategorized) {
                const res = await updateEssentialAsync({
                    type: EssentialsType.DEFAULT,
                    item: { ...item, category: suggestEssentialCategory(item.title) ?? undefined },
                });
                store.setDefaultEssentialsArray(res.updatedItems);
            }
            toast.success(tl("categorized", { count: uncategorized.length }));
        } catch (error) {
            console.error(error);
            toast.error(t("occurred"));
        }
    };

    const removeEssential = async (id: string) => {
        try {
            const type = EssentialsType.DEFAULT;
            const res = await removeEssentialAsync({ type, id });
            store.setDefaultEssentialsArray(res.updatedItems);
            if (editingId === id) resetForm();
            toast.success(t("essentials.removed"));
        } catch (error) {
            console.error(t("essentials.removeErrorRequest"), error);
            toast.error(t("essentials.removeError"));
        }
    };

    const clearAll = async () => {
        resetForm();
        setClearing(true);
        try {
            for (const { id } of arrayEssentials) {
                const res = await removeEssentialAsync({ type: EssentialsType.DEFAULT, id });
                store.setDefaultEssentialsArray(res.updatedItems);
            }
            toast.success(tl("cleared"));
        } catch (error) {
            console.error(t("essentials.removeErrorRequest"), error);
            toast.error(t("essentials.removeError"));
        } finally {
            setClearing(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const money = toStoredMoney(Number(values.amount), values.currency, userCurrency, rates);
        if (!money) {
            form.setError("amount", { message: t("conversionUnavailable") });
            return;
        }

        try {
            if (editingId) {
                const essential = arrayEssentials.find(({ id }) => id === editingId);

                if (!essential) {
                    resetForm();
                    toast.error(t("occurred"));
                    return;
                }

                const res = await updateEssentialAsync({
                    type: EssentialsType.DEFAULT,
                    item: {
                        ...essential,
                        title: values.title,
                        ...money,
                        category: values.category || undefined,
                    },
                });
                store.setDefaultEssentialsArray(res.updatedItems);
                resetForm();
                return;
            }

            const item = {
                id: uuidv4(),
                title: values.title || "",
                ...money,
                checked: false,
                ...(values.category ? { category: values.category } : {}),
            };
            const type = EssentialsType.DEFAULT;
            const res = await newEssentialAsync({ type, item });
            store.setDefaultEssentialsArray(res.updatedItems);
            toast.success(t("essentials.standartPaymentAdded"));

            resetForm();
        } catch (error) {
            console.error(t("essentials.addErrorRequest"), error);
            toast.error(t("essentials.addError"));
        }
    };

    return (
        <Dialog
            onOpenChange={() => resetForm()}
        >
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                        {triggerLabel ?? t("essentials.standardPaymentsTitle")}
                    </Button>
                </DialogTrigger>
                <DialogContent className="lg:max-w-dialog-wide">
                    <DialogHeader>
                        <DialogTitle>{t("essentials.standardPaymentsTitle")}</DialogTitle>
                        <DialogDescription>{t("essentials.standardPaymentsSubtitle")}</DialogDescription>
                    </DialogHeader>
                    <ListDialogBody>
                        <ListPanel
                            label={tl("items")}
                            summary={
                                arrayEssentials.length > 0 &&
                                `${arrayEssentials.length} · ${formatCurrency(listTotal)} ${getCurrencySymbol(userCurrency)}`
                            }
                            action={
                                arrayEssentials.length > 0 && (
                                    <ClearListButton
                                        label={tl("clearAll")}
                                        confirmLabel={tl("clearConfirm", { count: arrayEssentials.length })}
                                        disabled={pendings}
                                        onClear={clearAll}
                                    />
                                )
                            }
                            isEmpty={arrayEssentials.length === 0}
                            empty={<p className="text-ink-faint text-sm">{tl("empty")}</p>}
                            toolbar={
                                uncategorized.length > 0 && (
                                    <>
                                        <span className="text-ink-faint text-xs">
                                            {tl("uncategorized", { count: uncategorized.length })}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={categorizeAll}
                                            disabled={pendings}
                                        >
                                            {tl("categorize")}
                                        </Button>
                                    </>
                                )
                            }
                        >
                            {arrayEssentials.map((essential) => {
                                const { id, title, amount } = essential;
                                return (
                                    <ListRow
                                        key={id}
                                        title={title}
                                        meta={`${isForeignAmount(essential, userCurrency) ? `${formatCurrency(essential.currencyAmount)} ${getCurrencySymbol(essential.currency)} ≈ ` : ""}${formatCurrency(amount)} ${getCurrencySymbol(userCurrency)} · ${getCategoryLabel(essential.category || "essentials", tCategories)}`}
                                        active={editingId === id}
                                        copyValue={toMoneyInput(amount)}
                                        disabled={pendings}
                                        editLabel={tl("edit")}
                                        removeLabel={tl("remove")}
                                        onEdit={() => startEditing(essential)}
                                        onRemove={() => removeEssential(id)}
                                    />
                                );
                            })}
                        </ListPanel>
                        <FormPanel label={editingId ? tl("editing") : tl("newItem")}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("essentials.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("essentials.placeholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <EssentialAmountField form={form} />
                                <EssentialCategoryField form={form} onPick={() => setTouched(true)} />
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
                                    <Button disabled={pendings || !form.formState.isValid} type="submit">
                                        {editingId ? t("setTotal.save") : t("essentials.add")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </FormPanel>
                    </ListDialogBody>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
