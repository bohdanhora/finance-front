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
import { handleDecimalInputChange } from "lib/utils";
import { useState } from "react";
import { toast } from "react-toastify";
import { changeNextMonthFormSchema } from "schemas/other";
import { Edit2Icon } from "lucide-react";

export const Percentage = () => {
    const store = useStore();

    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs");

    const form = useForm<z.infer<typeof changeNextMonthFormSchema>>({
        resolver: zodResolver(changeNextMonthFormSchema),
        defaultValues: {
            value: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof changeNextMonthFormSchema>) => {
        try {
            store.setPercentage(Number(values.value));

            form.reset();
            setOpen(false);

            toast.success(tGlobal("toasts.percentChanged"));
        } catch (error) {
            console.error(t("changeNextMonthIncomeRequestError"), error);
            toast.error(t("changeNextMonthIncomeError"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button className="absolute -top-2 -right-6 rounded-full cursor-pointer w-6 h-6 p-0">
                        <Edit2Icon className="size-3" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>{t("percent.title")}</DialogTitle>
                            <DialogDescription>{t("percent.subtitle")}</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("percent.label")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("percent.from")}
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
