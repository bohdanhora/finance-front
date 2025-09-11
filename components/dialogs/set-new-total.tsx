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
import { setPercentageFormSchema } from "schemas/other";
import { Pencil } from "lucide-react";
import { useSetTotalAmount } from "api/main";

export const SetTotalDialog = () => {
    const store = useStore();

    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs.setTotal");

    const { mutateAsync: setTotalAsync, isPending: setTotalPending } = useSetTotalAmount();

    const form = useForm<z.infer<typeof setPercentageFormSchema>>({
        resolver: zodResolver(setPercentageFormSchema),
        defaultValues: {
            value: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof setPercentageFormSchema>) => {
        try {
            await setTotalAsync({ totalAmount: Number(values.value) });
            store.setTotalAmount(Number(values.value));

            form.reset();
            setOpen(false);

            toast.success(tGlobal("toasts.percentChanged"));
        } catch (error) {
            console.error(t("setPercentRequestError"), error);
            toast.error(t("setPercentError"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="ghost">
                        <Pencil className="w-6 h-6 text-gray-500 hover:text-black dark:hover:text-white" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>{t("title")}</DialogTitle>
                            <DialogDescription>{t("subtitle")}</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("label")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("placeholder")}
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
                                disabled={setTotalPending}
                            >
                                {t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    );
};
