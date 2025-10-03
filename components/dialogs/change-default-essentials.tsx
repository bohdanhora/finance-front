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
import { useNewEssential, useRemoveEssential } from "api/main";
import { Textarea } from "components/ui/textarea";
import { Label } from "components/ui/label";
import { XIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { EssentialsType } from "constants/index";
import { toast } from "react-toastify";
import { handleDecimalInputChange } from "lib/utils";
import { changeDefaultFormSchema } from "schemas/other";
import { getCurrencySymbol } from "lib/currency";

export const ChangeDefaultEssentials = () => {
    const store = useStore();
    const userCurrency = store.userCurrency;

    const arrayEssentials = store.defaultEssentialsArray;

    const { mutateAsync: newEssentialAsync, isPending: newEssentialPending } = useNewEssential();

    const { mutateAsync: removeEssentialAsync, isPending: removeEssentialPending } = useRemoveEssential();

    const pendings = removeEssentialPending || newEssentialPending;

    const t = useTranslations("dialogs");

    const form = useForm<z.infer<typeof changeDefaultFormSchema>>({
        resolver: zodResolver(changeDefaultFormSchema),
        defaultValues: {
            amount: "",
            title: "",
        },
    });

    const removeEssential = async (id: string) => {
        try {
            const type = EssentialsType.DEFAULT;
            const res = await removeEssentialAsync({ type, id });
            store.setDefaultEssentialsArray(res.updatedItems);
            toast.success(t("essentials.removed"));
        } catch (error) {
            console.error(t("essentials.removeErrorRequest"), error);
            toast.error(t("essentials.removeError"));
        }
    };

    const onSubmit = async (values: z.infer<typeof changeDefaultFormSchema>) => {
        try {
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

            form.reset();
        } catch (error) {
            console.error(t("essentials.addErrorRequest"), error);
            toast.error(t("essentials.addError"));
        }
    };

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="default">{t("essentials.standardPaymentsTitle")}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>{t("essentials.standardPaymentsTitle")}</DialogTitle>
                            <DialogDescription>{t("essentials.standardPaymentsSubtitle")}</DialogDescription>
                        </DialogHeader>
                        <ul className="flex flex-col gap-3">
                            {arrayEssentials?.map(({ id, title, amount }) => {
                                return (
                                    <li className="flex items-center gap-3" key={id}>
                                        <Label htmlFor={id} className="relative">
                                            {title} = {`${amount} ${getCurrencySymbol(userCurrency)}`}
                                            <Button
                                                type="button"
                                                disabled={pendings}
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
                                <Button variant="destructive">{t("cancel")}</Button>
                            </DialogClose>
                            <Button
                                disabled={pendings}
                                type="submit"
                                className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                            >
                                {t("essentials.add")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
