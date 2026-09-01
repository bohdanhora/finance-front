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
import { Textarea } from "ui/textarea";
import { Checkbox } from "components/ui/checkbox";
import { Label } from "components/ui/label";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import { EssentialsType } from "constants/index";
import { toast } from "react-toastify";
import { PencilIcon, XIcon } from "lucide-react";
import { useNewEssential, useRemoveEssential, useSetEssentialPayments, useUpdateEssential } from "api/main";
import { v4 as uuidv4 } from "uuid";
import { handleDecimalInputChange } from "lib/utils";
import { essentialSpendsFormSchema } from "schemas/other";
import { getCurrencySymbol } from "lib/currency";

import { useState } from "react";
import { EssentialType } from "types/transactions";
import { EssentialPaymentDialog } from "./essential-payment";

const getEmptyEssentialValues = () => ({ amount: "", title: "" });

type Props = {
    nextMonth?: boolean;
};

export const EssentialSpends = ({ nextMonth }: Props) => {
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

    const form = useForm<z.infer<typeof essentialSpendsFormSchema>>({
        resolver: zodResolver(essentialSpendsFormSchema),
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

    const onSubmit = async (values: z.infer<typeof essentialSpendsFormSchema>) => {
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
                        title: values.title,
                        amount: Number(values.amount),
                    },
                });

                if (nextMonth) {
                    store.setNextMonthEssentialsArray(res.updatedItems);
                } else {
                    store.setEssentialsArray(res.updatedItems);
                }

                resetForm();
                return;
            }

            const item = {
                id: uuidv4(),
                title: values.title || "",
                amount: Number(values.amount) || 0,
                checked: false,
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

    return (
        <>
            <Dialog
                onOpenChange={(open) => {
                    if (!open) {
                        resetForm();
                    }
                }}
            >
                <Form {...form}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" className="h-fit">
                            {nextMonth ? t("dialogs.essentials.nextMonth") : t("dialogs.essentials.title")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t("dialogs.essentials.title")}</DialogTitle>
                            <DialogDescription>{t("dialogs.essentials.hint")}</DialogDescription>
                        </DialogHeader>
                        <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
                            {arrayEssentials?.map((essential) => {
                                const { id, title, amount, checked } = essential;
                                return (
                                    <li
                                        className="border-border/70 bg-muted/25 flex items-center gap-3 rounded-xl border px-3 py-2.5"
                                        key={id}
                                    >
                                        <Checkbox
                                            id={id}
                                            checked={checked}
                                            onCheckedChange={() => setSelectedEssential(essential)}
                                        />
                                        <Label
                                            htmlFor={id}
                                            className={twMerge(
                                                "min-w-0 flex-1 cursor-pointer",
                                                checked && "opacity-55",
                                            )}
                                        >
                                            <span
                                                className={twMerge(
                                                    "block truncate text-sm font-medium",
                                                    checked && "line-through",
                                                )}
                                            >
                                                {title}
                                            </span>
                                            <span className="text-muted-foreground mt-0.5 block text-xs tabular-nums">
                                                {checked ? (essential.paidAmount ?? amount) : amount}{" "}
                                                {getCurrencySymbol(userCurrency)}
                                            </span>
                                        </Label>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button
                                                type="button"
                                                disabled={apiPendings || checked}
                                                onClick={() => startEditing(essential)}
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-foreground size-8 rounded-lg p-0"
                                                aria-label={t("transactions.edit")}
                                            >
                                                <PencilIcon className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={apiPendings || checked}
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
                        {arrayEssentials.length <= 0 && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={setDefaultsEssentials}
                                disabled={apiPendings}
                            >
                                {t("dialogs.essentials.fillStandard")}
                            </Button>
                        )}
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("dialogs.amount")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("dialogs.amount")}
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
                                        <FormLabel>{t("dialogs.essentials.label")}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t("dialogs.essentials.placeholder")}
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
                                    <Button variant="secondary">{t("dialogs.cancel")}</Button>
                                </DialogClose>
                                <Button
                                    disabled={apiPendings}
                                    type="submit"
                                    className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                                >
                                    {editingId ? t("dialogs.setTotal.save") : t("dialogs.submit")}
                                </Button>
                            </DialogFooter>
                        </form>
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
