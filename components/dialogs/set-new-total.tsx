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
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { balanceFromAvailable, creditLimitOf } from "lib/cards";
import { getCurrencySymbol } from "lib/currency";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { setTotalFormSchema } from "schemas/other";
import { useValidationMessages } from "lib/validation";
import { Pencil } from "lucide-react";
import { useSetTotalAmount } from "api/main";
import { Card } from "types/transactions";
import { useCardName } from "components/cards/card-face";

export const SetTotalDialog = ({ card }: { card: Card }) => {
    const store = useStore();
    const cardName = useCardName();

    const [open, setOpen] = useState(false);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs.setTotal");
    const limit = creditLimitOf(card);
    const symbol = getCurrencySymbol(store.userCurrency);

    const { mutateAsync: setTotalAsync, isPending: setTotalPending } = useSetTotalAmount();

    const validationMessages = useValidationMessages();
    const formSchema = useMemo(() => setTotalFormSchema(validationMessages), [validationMessages]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        },
    });

    const resetForm = () => form.reset({ value: "" });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) resetForm();
        setOpen(nextOpen);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const entered = Number(values.value);
            const response = await setTotalAsync({
                totalAmount: limit > 0 ? balanceFromAvailable(entered, limit) : entered,
                cardId: card.id,
            });
            store.applyServerUpdate({ totalAmount: response.totalAmount, updatedCards: response.updatedCards });

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
                        size="icon"
                        aria-label={t("title")}
                        className="text-muted-foreground hover:text-foreground size-8 shrink-0"
                    >
                        <Pencil className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("title")}</DialogTitle>
                            <DialogDescription>{t("cardSubtitle", { card: cardName(card) })}</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{limit > 0 ? t("creditLabel") : t("label")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            inputMode="decimal"
                                            placeholder={t("placeholder")}
                                            {...field}
                                            onChange={handleDecimalInputChange(field.onChange)}
                                        />
                                    </FormControl>
                                    {limit > 0 && (
                                        <p className="text-muted-foreground text-xs">
                                            {t("creditHint", { limit: `${formatCurrency(limit)} ${symbol}` })}
                                        </p>
                                    )}
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
