"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { Calculator, CalendarDays, Link2, Plus, X } from "lucide-react";

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
import { GOAL_LINKS_LIMIT, calculateSavingsPace, getSavingsBalance, goalLinks, normalizeGoalUrl } from "lib/savings";
import { Textarea } from "components/ui/textarea";
import { Label } from "components/ui/label";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import { toMoneyInput } from "lib/money";
import { getCurrencySymbol } from "lib/currency";
import { ValidationMessages, useValidationMessages } from "lib/validation";
import { Hint } from "components/hint";

const getGoalSchema = (messages: ValidationMessages) =>
    z.object({
        name: z.string().trim().min(1, messages.title).max(80, messages.titleTooLong(80)),
        targetAmount: z.string().refine((value) => Number(value) > 0, { message: messages.amount }),
        monthlyContribution: z
            .string()
            .refine((value) => value === "" || Number(value) >= 0, { message: messages.amount }),
        currency: z.nativeEnum(CURRENCY, messages.currency),
        targetDate: z.string(),
        links: z.array(
            z.object({
                value: z.string().refine((value) => value.trim() === "" || normalizeGoalUrl(value) !== null, {
                    message: messages.url,
                }),
            }),
        ),
        note: z.string().max(1000),
    });

type GoalFormValues = z.infer<ReturnType<typeof getGoalSchema>>;

const getEmptyValues = (currency: CURRENCY): GoalFormValues => ({
    name: "",
    targetAmount: "",
    monthlyContribution: "",
    currency,
    targetDate: "",
    links: [{ value: "" }],
    note: "",
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

    const validationMessages = useValidationMessages();
    const goalSchema = useMemo(() => getGoalSchema(validationMessages), [validationMessages]);

    const form = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        mode: "onChange",
        defaultValues: getEmptyValues(userCurrency),
    });
    const links = useFieldArray({ control: form.control, name: "links" });

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

        form.setValue("monthlyContribution", toMoneyInput(savingsPace.monthlyAmount), {
            shouldValidate: true,
        });
    }, [form, open, savingsPace]);

    useEffect(() => {
        if (!open) return;

        form.reset(
            goal
                ? {
                      name: goal.name,
                      targetAmount: toMoneyInput(goal.targetAmount),
                      monthlyContribution: goal.monthlyContribution ? toMoneyInput(goal.monthlyContribution) : "",
                      currency: goal.currency,
                      targetDate: goal.targetDate?.slice(0, 10) ?? "",
                      links: goalLinks(goal).length ? goalLinks(goal).map((value) => ({ value })) : [{ value: "" }],
                      note: goal.note ?? "",
                  }
                : getEmptyValues(userCurrency),
        );
    }, [form, goal, open, userCurrency]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) form.reset(getEmptyValues(userCurrency));
        onOpenChange(nextOpen);
    };

    const onSubmit = async (values: GoalFormValues) => {
        const normalizedLinks = [
            ...new Set(
                values.links
                    .map(({ value }) => normalizeGoalUrl(value))
                    .filter((value): value is string => Boolean(value)),
            ),
        ];
        const item: SavingsGoal = {
            id: goal?.id ?? uuidv4(),
            name: values.name.trim(),
            targetAmount: Number(values.targetAmount),
            monthlyContribution: Number(values.monthlyContribution) || 0,
            currency: values.currency,
            targetDate: values.targetDate || undefined,
            url: normalizedLinks[0],
            links: normalizedLinks.length ? normalizedLinks : undefined,
            note: values.note.trim() || undefined,
            createdAt: goal?.createdAt ?? new Date().toISOString(),
        };

        try {
            const response = goal ? await updateGoal({ item }) : await addGoal({ item });
            setSavingsGoals(response.updatedGoals);
            setSavingsOperations(response.updatedOperations);
            toast.success(goal ? t("goalUpdated") : t("goalCreated"));
            handleOpenChange(false);
        } catch {}
    };

    const pending = adding || updating;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
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

                        <div className="flex gap-3 *:first:min-w-0 *:first:flex-1 *:last:w-32 *:last:shrink-0">
                            <FormField
                                control={form.control}
                                name="targetAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("targetAmount")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                inputMode="decimal"
                                                placeholder="0"
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
                                                className="read-only:bg-wash read-only:text-ink read-only:cursor-default"
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

                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Label>{t("links")}</Label>
                                <Hint text={t("linksHint")} />
                            </div>
                            {links.fields.map((link, index) => (
                                <FormField
                                    key={link.id}
                                    control={form.control}
                                    name={`links.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="relative">
                                                <Link2 className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                                <FormControl>
                                                    <Input
                                                        inputMode="url"
                                                        autoComplete="off"
                                                        placeholder={t("goalUrlPlaceholder")}
                                                        className="pr-11 pl-9"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                {(links.fields.length > 1 || field.value) && (
                                                    <button
                                                        type="button"
                                                        aria-label={t("removeLink")}
                                                        title={t("removeLink")}
                                                        onClick={() =>
                                                            links.fields.length > 1
                                                                ? links.remove(index)
                                                                : form.setValue(`links.${index}.value`, "", {
                                                                      shouldValidate: true,
                                                                  })
                                                        }
                                                        className="text-ink-faint hover:text-signal hover:bg-signal-wash absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                            {links.fields.length < GOAL_LINKS_LIMIT && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => links.append({ value: "" })}
                                >
                                    <Plus />
                                    {t("addLinkField")}
                                </Button>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("goalNote")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            maxLength={1000}
                                            placeholder={t("goalNotePlaceholder")}
                                            className="min-h-20 resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {savingsPace && (
                            <div
                                className={
                                    savingsPace.isOverdue
                                        ? "border-signal border-l-2 py-1 pl-4"
                                        : "border-accent border-l-2 py-1 pl-4"
                                }
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={
                                            savingsPace.isOverdue
                                                ? "text-signal flex shrink-0 items-center justify-center"
                                                : "text-accent flex shrink-0 items-center justify-center"
                                        }
                                    >
                                        <Calculator className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-1.5 text-sm font-semibold">
                                            {t("requiredPace")}
                                            {!savingsPace.isOverdue && <Hint text={t("calculatedPlan")} />}
                                        </p>
                                        <p className="text-ink-faint text-xs">
                                            {savingsPace.isOverdue
                                                ? t("deadlinePassed")
                                                : t("daysToGoal", { count: savingsPace.daysRemaining })}
                                        </p>
                                    </div>
                                </div>

                                {!savingsPace.isOverdue && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <div className="border-rule border-l pl-3">
                                            <p className="label flex items-center gap-1.5">
                                                <CalendarDays className="size-3.5" />
                                                {t("daily")}
                                            </p>
                                            <p className="mt-1 font-semibold tabular-nums">
                                                {planMoney(savingsPace.dailyAmount)}
                                            </p>
                                        </div>
                                        <div className="border-rule border-l pl-3">
                                            <p className="label">{t("monthly")}</p>
                                            <p className="mt-1 font-semibold tabular-nums">
                                                {planMoney(savingsPace.monthlyAmount)}
                                            </p>
                                        </div>
                                    </div>
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
