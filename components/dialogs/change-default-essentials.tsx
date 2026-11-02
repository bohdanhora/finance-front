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
import { FormPanel, ListDialogBody, ListPanel, ListRow } from "ui/list-dialog";
import { v4 as uuidv4 } from "uuid";
import { EssentialsType } from "constants/index";
import { toast } from "react-toastify";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { toMoneyInput } from "lib/money";
import { changeDefaultFormSchema } from "schemas/other";
import { useValidationMessages } from "lib/validation";
import { getCurrencySymbol } from "lib/currency";

import { useMemo, useState } from "react";
import { EssentialType } from "types/transactions";

const getEmptyEssentialValues = () => ({ amount: "", title: "" });

export const ChangeDefaultEssentials = ({ triggerLabel }: { triggerLabel?: string }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const store = useStore();
    const userCurrency = store.userCurrency;

    const arrayEssentials = store.defaultEssentialsArray;
    const listTotal = arrayEssentials.reduce((sum, { amount }) => sum + amount, 0);

    const { mutateAsync: newEssentialAsync, isPending: newEssentialPending } = useNewEssential();

    const { mutateAsync: removeEssentialAsync, isPending: removeEssentialPending } = useRemoveEssential();
    const { mutateAsync: updateEssentialAsync, isPending: updateEssentialPending } = useUpdateEssential();

    const pendings = removeEssentialPending || newEssentialPending || updateEssentialPending;

    const t = useTranslations("dialogs");
    const tl = useTranslations("listDialog");

    const validationMessages = useValidationMessages();
    const formSchema = useMemo(() => changeDefaultFormSchema(validationMessages), [validationMessages]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getEmptyEssentialValues(),
    });

    const resetForm = () => {
        setEditingId(null);
        form.reset(getEmptyEssentialValues());
    };

    const startEditing = (essential: EssentialType) => {
        setEditingId(essential.id);
        form.reset(
            {
                amount: toMoneyInput(essential.amount),
                title: essential.title,
            },
            { keepDefaultValues: true },
        );
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

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
                        amount: Number(values.amount),
                    },
                });
                store.setDefaultEssentialsArray(res.updatedItems);
                resetForm();
                return;
            }

            const item = {
                id: uuidv4(),
                title: values.title || "",
                amount: Number(values.amount) || 0,
                checked: false,
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
            onOpenChange={(open) => {
                if (!open) {
                    resetForm();
                }
            }}
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
                            isEmpty={arrayEssentials.length === 0}
                            empty={<p className="text-ink-faint text-sm">{tl("empty")}</p>}
                        >
                            {arrayEssentials.map(({ id, title, amount }) => (
                                <ListRow
                                    key={id}
                                    title={title}
                                    meta={`${formatCurrency(amount)} ${getCurrencySymbol(userCurrency)}`}
                                    active={editingId === id}
                                    copyValue={toMoneyInput(amount)}
                                    disabled={pendings}
                                    editLabel={tl("edit")}
                                    removeLabel={tl("remove")}
                                    onEdit={() => startEditing({ id, title, amount, checked: false })}
                                    onRemove={() => removeEssential(id)}
                                />
                            ))}
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
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("amount")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    inputMode="decimal"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={handleDecimalInputChange(field.onChange)}
                                                />
                                            </FormControl>
                                            <FormMessage />
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
