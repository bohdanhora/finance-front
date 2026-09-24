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
import { balanceFromParts, creditLimitOf, creditUsedOf, ownMoneyOf } from "lib/cards";
import { Label } from "ui/label";
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
    const [debt, setDebt] = useState("");
    const [debtError, setDebtError] = useState<string | null>(null);

    const tGlobal = useTranslations();
    const t = useTranslations("dialogs.setTotal");
    const tCards = useTranslations("cards");
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
        if (nextOpen && limit > 0) {
            form.reset({ value: String(ownMoneyOf(card)) });
            setDebt(creditUsedOf(card) ? String(creditUsedOf(card)) : "");
        }
        setDebtError(null);
        setOpen(nextOpen);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const entered = Number(values.value);
            const owed = limit > 0 ? Number(debt) || 0 : 0;
            if (owed > limit) {
                setDebtError(tCards("debtOverLimit", { amount: `${formatCurrency(limit)} ${symbol}` }));
                return;
            }
            const response = await setTotalAsync({
                totalAmount: limit > 0 ? balanceFromParts(entered, owed) : entered,
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
                                    <FormLabel>{limit > 0 ? tCards("ownOnCard") : t("label")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            inputMode="decimal"
                                            placeholder={t("placeholder")}
                                            {...field}
                                            onChange={handleDecimalInputChange(field.onChange)}
                                        />
                                    </FormControl>
                                    {limit > 0 && (
                                        <p className="text-muted-foreground text-xs">{tCards("ownOnCardHint")}</p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {limit > 0 && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="set-total-debt">{tCards("debtOnCard")}</Label>
                                <Input
                                    id="set-total-debt"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={debt}
                                    onChange={handleDecimalInputChange((value) => {
                                        setDebt(value);
                                        setDebtError(null);
                                    })}
                                />
                                <p className="text-muted-foreground text-xs">
                                    {tCards("debtOnCardHint")} (
                                    {tCards("limitOnFace", { amount: `${formatCurrency(limit)} ${symbol}` })})
                                </p>
                                {debtError && <p className="text-sm text-rose-600 dark:text-rose-400">{debtError}</p>}
                            </div>
                        )}
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
