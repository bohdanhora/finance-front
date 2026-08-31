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
import { handleFrom1To100InputChange } from "lib/utils";
import { useState } from "react";
import { toast } from "react-toastify";
import { setPercentageFormSchema } from "schemas/other";
import { Edit2Icon } from "lucide-react";
import { useSavePercent } from "api/main";

export const Percentage = () => {
    const store = useStore();

    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs");

    const { mutateAsync: savePercent, isPending: percentPending } = useSavePercent();

    const form = useForm<z.infer<typeof setPercentageFormSchema>>({
        resolver: zodResolver(setPercentageFormSchema),
        defaultValues: {
            value: "",
        },
    });

    const resetForm = () => form.reset({ value: "" });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) resetForm();
        setOpen(nextOpen);
    };

    const onSubmit = async (values: z.infer<typeof setPercentageFormSchema>) => {
        try {
            store.setPercentage(Number(values.value));
            await savePercent({ percent: Number(values.value) });

            resetForm();
            setOpen(false);

            toast.success(tGlobal("toasts.percentChanged"));
        } catch (error) {
            console.error(t("setPercentRequestError"), error);
            toast.error(t("setPercentError"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground size-7 shrink-0 rounded-lg p-0"
                    >
                        <Edit2Icon className="size-3" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                                            onChange={handleFrom1To100InputChange(field.onChange)}
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
                                type="submit"
                                className={twMerge(!form.formState.isValid && "opacity-10 pointer-events-none")}
                                disabled={percentPending}
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
