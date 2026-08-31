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
import { twMerge } from "tailwind-merge";
import { useNewEssential, useRemoveEssential, useUpdateEssential } from "api/main";
import { Textarea } from "components/ui/textarea";
import { PencilIcon, XIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { EssentialsType } from "constants/index";
import { toast } from "react-toastify";
import { handleDecimalInputChange } from "lib/utils";
import { changeDefaultFormSchema } from "schemas/other";
import { getCurrencySymbol } from "lib/currency";

import { useState } from "react";
import { EssentialType } from "types/transactions";

const getEmptyEssentialValues = () => ({ amount: "", title: "" });

export const ChangeDefaultEssentials = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const store = useStore();
    const userCurrency = store.userCurrency;

    const arrayEssentials = store.defaultEssentialsArray;

    const { mutateAsync: newEssentialAsync, isPending: newEssentialPending } = useNewEssential();

    const { mutateAsync: removeEssentialAsync, isPending: removeEssentialPending } = useRemoveEssential();
    const { mutateAsync: updateEssentialAsync, isPending: updateEssentialPending } = useUpdateEssential();

    const pendings = removeEssentialPending || newEssentialPending || updateEssentialPending;

    const t = useTranslations("dialogs");

    const form = useForm<z.infer<typeof changeDefaultFormSchema>>({
        resolver: zodResolver(changeDefaultFormSchema),
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
                amount: String(essential.amount),
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

    const onSubmit = async (values: z.infer<typeof changeDefaultFormSchema>) => {
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
                    <Button variant="secondary">{t("essentials.standardPaymentsTitle")}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("essentials.standardPaymentsTitle")}</DialogTitle>
                            <DialogDescription>{t("essentials.standardPaymentsSubtitle")}</DialogDescription>
                        </DialogHeader>
                        <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                            {arrayEssentials?.map(({ id, title, amount }) => {
                                return (
                                    <li
                                        className="border-border/70 bg-muted/25 flex items-center gap-3 rounded-xl border px-3 py-2.5"
                                        key={id}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{title}</p>
                                            <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                                                {amount} {getCurrencySymbol(userCurrency)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button
                                                type="button"
                                                disabled={pendings}
                                                onClick={() => startEditing({ id, title, amount, checked: false })}
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-foreground size-8 rounded-lg p-0"
                                                aria-label={t("change")}
                                            >
                                                <PencilIcon className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={pendings}
                                                onClick={() => removeEssential(id)}
                                                variant="ghost"
                                                className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500 size-8 rounded-lg p-0"
                                            >
                                                <XIcon className="size-3.5" />
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("amount")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("amount")}
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
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("essentials.label")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("essentials.placeholder")}
                                            className="min-h-20 resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">{t("cancel")}</Button>
                            </DialogClose>
                            <Button
                                disabled={pendings}
                                type="submit"
                                className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                            >
                                {editingId ? t("setTotal.save") : t("essentials.add")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
