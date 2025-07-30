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
import { useSetNextMonthTotalAmount } from "api/main";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { useState } from "react";
import { toast } from "react-toastify";

const formSchema = z.object({
    value: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)(\.\d{0,2})?$/)
        .refine((val) => {
            const num = Number(val);
            return !isNaN(num) && num > 0;
        }),
});

export const ChangeNextMonthIncome = () => {
    const store = useStore();
    const { mutateAsync: setNextMonthAmountAsync } = useSetNextMonthTotalAmount();
    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            store.setNextMonthTotalAmount(Number(values.value));

            await setNextMonthAmountAsync({
                nextMonthTotalAmount: Number(values.value),
            });

            form.reset();
            setOpen(false);

            toast.success(
                tGlobal("toasts.nextMonthIcomeChanged", {
                    amount: formatCurrency(Number(values.value)),
                }),
            );
        } catch (error) {
            console.error(t("changeNextMonthIncomeRequestError"), error);
            toast.error(t("changeNextMonthIncomeError"));
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="default">{t("changeNextMonthIncome")}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>{t("expectedIncome")}</DialogTitle>
                            <DialogDescription>{t("planNextMonth")}</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("inputIncome")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("inputIncome")}
                                            {...field}
                                            onChange={handleDecimalInputChange(field.onChange)}
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
                                type="submit"
                                className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                            >
                                {t("submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
