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
import { XIcon } from "lucide-react";
import { useNewEssential, useRemoveEssential, useSetCheckedEssential, useSetEssentialPayments } from "api/main";
import { v4 as uuidv4 } from "uuid";
import { handleDecimalInputChange } from "lib/utils";
import { essentialSpendsFormSchema } from "schemas/other";

type Props = {
    nextMonth?: boolean;
};

export const EssentialSpends = ({ nextMonth }: Props) => {
    const store = useStore();

    const t = useTranslations();

    const { mutateAsync: checkedEssentialAsync, isPending: checkedEssentialPending } = useSetCheckedEssential();
    const { mutateAsync: essentialPaymentsAsync, isPending: essentialPaymentsPending } = useSetEssentialPayments();
    const { mutateAsync: removeEssentialAsync, isPending: removeEssentialPending } = useRemoveEssential();
    const { mutateAsync: newEssentialAsync, isPending: newEssentialPending } = useNewEssential();

    const apiPendings =
        checkedEssentialPending || essentialPaymentsPending || removeEssentialPending || newEssentialPending;

    const arrayEssentials = nextMonth ? store.nextMonthEssentialsArray : store.essentialsArray;

    const form = useForm<z.infer<typeof essentialSpendsFormSchema>>({
        resolver: zodResolver(essentialSpendsFormSchema),
        defaultValues: {
            amount: "",
            title: "",
        },
    });

    const checkedFunc = async (id: string, checked: boolean) => {
        try {
            if (nextMonth) {
                const type = EssentialsType.NEXT_MONTH;
                const item = { id, checked };
                const res = await checkedEssentialAsync({ type, item });
                store.setNextMonthEssentialsArray(res.updatedItems);
            } else {
                const type = EssentialsType.THIS_MONTH;
                const item = { id, checked };
                const res = await checkedEssentialAsync({ type, item });
                store.setEssentialsArray(res.updatedItems);
            }
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

            toast.success(t("dialogs.essentials.removed"));
        } catch (error) {
            console.error(error);
            toast.error(t("dialogs.occurred"));
        }
    };

    const onSubmit = async (values: z.infer<typeof essentialSpendsFormSchema>) => {
        try {
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

            form.reset();
        } catch (error) {
            console.error(error);
            toast.error(t("dialogs.occurred"));
        }
    };

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="default" className="h-fit">
                        {nextMonth ? t("dialogs.essentials.nextMonth") : t("dialogs.essentials.title")}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t("dialogs.essentials.title")}</DialogTitle>
                        <DialogDescription>{t("dialogs.essentials.hint")}</DialogDescription>
                    </DialogHeader>
                    <ul className="flex flex-col gap-3">
                        {arrayEssentials?.map(({ id, title, amount, checked }) => {
                            return (
                                <li className="flex items-center gap-3" key={id}>
                                    <Checkbox
                                        id={id}
                                        checked={checked}
                                        onCheckedChange={(val) => checkedFunc(id, Boolean(val))}
                                    />
                                    <Label htmlFor={id} className={twMerge("relative", checked && "line-through")}>
                                        {title} = {`${amount} ₴`}
                                        <Button
                                            disabled={apiPendings}
                                            onClick={() => removeEssential(id)}
                                            variant="ghost"
                                            className="size-4 absolute -right-10"
                                        >
                                            <XIcon />
                                        </Button>
                                    </Label>
                                </li>
                            );
                        })}
                    </ul>
                    {arrayEssentials.length <= 0 && (
                        <Button onClick={setDefaultsEssentials} disabled={apiPendings}>
                            {t("dialogs.essentials.fillStandard")}
                        </Button>
                    )}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive">{t("dialogs.cancel")}</Button>
                            </DialogClose>
                            <Button
                                disabled={apiPendings}
                                type="submit"
                                className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                            >
                                {t("dialogs.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
