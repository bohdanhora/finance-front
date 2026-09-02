"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { Calculator, CalendarDays } from "lucide-react";

import { useAddSavingsGoal, useUpdateSavingsGoal } from "api/main";
import { CURRENCY } from "constants/index";
import useBankStore from "store/bank";
import useStore from "store/general";
import { SavingsGoal } from "types/transactions";
import { Button } from "components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { DatePicker } from "components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { calculateSavingsPace, getSavingsBalance } from "lib/savings";
import { formatCurrency } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";

const goalSchema = z.object({
    name: z.string().trim().min(1).max(80),
    targetAmount: z.string().refine((value) => Number(value) > 0),
    monthlyContribution: z.string().refine((value) => value === "" || Number(value) >= 0),
    currency: z.nativeEnum(CURRENCY),
    targetDate: z.string(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

const getEmptyValues = (currency: CURRENCY): GoalFormValues => ({
    name: "",
    targetAmount: "",
    monthlyContribution: "",
    currency,
    targetDate: "",
});

type Props = {
    open: boolean;
    goal: SavingsGoal | null;
    onOpenChange: (open: boolean) => void;
};

export const SavingsGoalDialog = ({ open, goal, onOpenChange }: Props) => {
    const t = useTranslations("savings");
    const tNav = useTranslations("navbar");
    const userCurrency = useStore((state) => state.userCurrency);
    const setSavingsGoals = useStore((state) => state.setSavingsGoals);
    const setSavingsOperations = useStore((state) => state.setSavingsOperations);
    const storeSavingsOperations = useStore((state) => state.savingsOperations);
    const usdToUah = useBankStore((state) => state.usd?.rateBuy ?? 0);
    const eurToUah = useBankStore((state) => state.eur?.rateBuy ?? 0);
    const { mutateAsync: addGoal, isPending: adding } = useAddSavingsGoal();
    const { mutateAsync: updateGoal, isPending: updating } = useUpdateSavingsGoal();

    const form = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        mode: "onChange",
        defaultValues: getEmptyValues(userCurrency),
    });

    const targetAmount = Number(form.watch("targetAmount")) || 0;
    const targetDate = form.watch("targetDate");
    const selectedCurrency = form.watch("currency");
    const sharedSavings = getSavingsBalance(storeSavingsOperations, selectedCurrency, {
        usdToUah,
        eurToUah,
    });
    const savedAmount = Math.max(sharedSavings ?? 0, 0);
    const remainingAmount = Math.max(targetAmount - savedAmount, 0);
    const savingsPace = useMemo(() => calculateSavingsPace(remainingAmount, targetDate), [remainingAmount, targetDate]);
    const today = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }, []);

    const planMoney = (value: number) => `${formatCurrency(value)} ${getCurrencySymbol(selectedCurrency)}`;

    useEffect(() => {
        if (!open || !savingsPace || savingsPace.isOverdue) return;

        form.setValue("monthlyContribution", String(savingsPace.monthlyAmount), {
            shouldValidate: true,
        });
    }, [form, open, savingsPace]);

    useEffect(() => {
        if (!open) return;

        form.reset(
            goal
                ? {
                      name: goal.name,
                      targetAmount: String(goal.targetAmount),
                      monthlyContribution: goal.monthlyContribution ? String(goal.monthlyContribution) : "",
                      currency: goal.currency,
                      targetDate: goal.targetDate?.slice(0, 10) ?? "",
                  }
                : getEmptyValues(userCurrency),
        );
    }, [form, goal, open, userCurrency]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) form.reset(getEmptyValues(userCurrency));
        onOpenChange(nextOpen);
    };

    const onSubmit = async (values: GoalFormValues) => {
        const item: SavingsGoal = {
            id: goal?.id ?? uuidv4(),
            name: values.name.trim(),
            targetAmount: Number(values.targetAmount),
            monthlyContribution: Number(values.monthlyContribution) || 0,
            currency: values.currency,
            targetDate: values.targetDate || undefined,
            createdAt: goal?.createdAt ?? new Date().toISOString(),
        };

        try {
            const response = goal ? await updateGoal({ item }) : await addGoal({ item });
            setSavingsGoals(response.updatedGoals);
            setSavingsOperations(response.updatedOperations);
            toast.success(goal ? t("goalUpdated") : t("goalCreated"));
            handleOpenChange(false);
        } catch {
            // The shared API error handler already shows the server message.
        }
    };

    const pending = adding || updating;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{goal ? t("editGoal") : t("newGoal")}</DialogTitle>
                            <DialogDescription>{t("goalDialogHint")}</DialogDescription>
                        </DialogHeader>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("goalName")}</FormLabel>
                                    <FormControl>
                                        <Input autoFocus placeholder={t("goalNamePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
                            <FormField
                                control={form.control}
                                name="targetAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("targetAmount")}</FormLabel>
                                        <FormControl>
                                            <Input inputMode="decimal" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("currency")}</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(CURRENCY).map((currency) => (
                                                    <SelectItem key={currency} value={currency}>
                                                        {tNav(currency)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="monthlyContribution"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("monthlyContribution")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="decimal"
                                                placeholder="0"
                                                readOnly={Boolean(savingsPace && !savingsPace.isOverdue)}
                                                className="read-only:bg-muted/50 read-only:text-foreground read-only:cursor-default"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="targetDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("targetDate")}</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                disabledDates={{ before: today }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {savingsPace && (
                            <div
                                className={
                                    savingsPace.isOverdue
                                        ? "rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] p-4"
                                        : "rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4"
                                }
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={
                                            savingsPace.isOverdue
                                                ? "flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500"
                                                : "flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                                        }
                                    >
                                        <Calculator className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold">{t("requiredPace")}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {savingsPace.isOverdue
                                                ? t("deadlinePassed")
                                                : t("daysToGoal", { count: savingsPace.daysRemaining })}
                                        </p>
                                    </div>
                                </div>

                                {!savingsPace.isOverdue && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <div className="bg-background/70 rounded-xl px-3 py-2.5">
                                            <p className="text-muted-foreground flex items-center gap-1.5 text-[0.7rem] font-medium uppercase">
                                                <CalendarDays className="size-3.5" />
                                                {t("daily")}
                                            </p>
                                            <p className="mt-1 font-semibold tabular-nums">
                                                {planMoney(savingsPace.dailyAmount)}
                                            </p>
                                        </div>
                                        <div className="bg-background/70 rounded-xl px-3 py-2.5">
                                            <p className="text-muted-foreground text-[0.7rem] font-medium uppercase">
                                                {t("monthly")}
                                            </p>
                                            <p className="mt-1 font-semibold tabular-nums">
                                                {planMoney(savingsPace.monthlyAmount)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!savingsPace.isOverdue && (
                                    <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                                        {t("calculatedPlan")}
                                    </p>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    {t("cancel")}
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={pending || !form.formState.isValid || savingsPace?.isOverdue}
                            >
                                {goal ? t("save") : t("create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
