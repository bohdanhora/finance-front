"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { useAddSavingsOperation } from "api/main";
import useStore from "store/general";
import { SavingsGoal, SavingsOperation, SavingsOperationType, SavingsStorage } from "types/transactions";
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
import { Textarea } from "components/ui/textarea";

const operationSchema = z
    .object({
        goalId: z.string().min(1),
        type: z.nativeEnum(SavingsOperationType),
        storage: z.nativeEnum(SavingsStorage),
        destinationStorage: z.nativeEnum(SavingsStorage),
        amount: z.string().refine((value) => Number(value) > 0),
        date: z.string().min(1),
        note: z.string().max(160),
    })
    .refine((values) => values.type !== SavingsOperationType.TRANSFER || values.storage !== values.destinationStorage, {
        path: ["destinationStorage"],
    });

type OperationFormValues = z.infer<typeof operationSchema>;

const getEmptyValues = (goalId = ""): OperationFormValues => ({
    goalId,
    type: SavingsOperationType.DEPOSIT,
    storage: SavingsStorage.CARD,
    destinationStorage: SavingsStorage.CASH,
    amount: "",
    date: dayjs().format("YYYY-MM-DD"),
    note: "",
});

type Props = {
    open: boolean;
    goals: SavingsGoal[];
    initialGoalId?: string;
    onOpenChange: (open: boolean) => void;
};

export const SavingsOperationDialog = ({ open, goals, initialGoalId, onOpenChange }: Props) => {
    const t = useTranslations("savings");
    const setSavingsGoals = useStore((state) => state.setSavingsGoals);
    const setSavingsOperations = useStore((state) => state.setSavingsOperations);
    const { mutateAsync: addOperation, isPending } = useAddSavingsOperation();

    const form = useForm<OperationFormValues>({
        resolver: zodResolver(operationSchema),
        mode: "onChange",
        defaultValues: getEmptyValues(),
    });

    useEffect(() => {
        if (!open) return;
        form.reset(getEmptyValues(initialGoalId || goals[0]?.id || ""));
    }, [form, goals, initialGoalId, open]);

    const type = form.watch("type");
    const storage = form.watch("storage");
    const destinationStorage = form.watch("destinationStorage");

    useEffect(() => {
        if (type === SavingsOperationType.TRANSFER && destinationStorage === storage) {
            form.setValue(
                "destinationStorage",
                storage === SavingsStorage.CARD ? SavingsStorage.CASH : SavingsStorage.CARD,
                { shouldValidate: true },
            );
        }
    }, [destinationStorage, form, storage, type]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) form.reset(getEmptyValues());
        onOpenChange(nextOpen);
    };

    const onSubmit = async (values: OperationFormValues) => {
        const goal = goals.find(({ id }) => id === values.goalId);
        if (!goal) return;

        const item: SavingsOperation = {
            id: uuidv4(),
            goalId: values.goalId,
            type: values.type,
            storage: values.storage,
            destinationStorage: values.type === SavingsOperationType.TRANSFER ? values.destinationStorage : undefined,
            amount: Number(values.amount),
            currency: goal.currency,
            date: new Date(`${values.date}T12:00:00.000Z`).toISOString(),
            note: values.note.trim() || undefined,
        };

        try {
            const response = await addOperation({ item });
            setSavingsGoals(response.updatedGoals);
            setSavingsOperations(response.updatedOperations);
            toast.success(t("operationSaved"));
            handleOpenChange(false);
        } catch {
            // The shared API error handler already shows the server message.
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{t("newOperation")}</DialogTitle>
                            <DialogDescription>{t("operationDialogHint")}</DialogDescription>
                        </DialogHeader>

                        <FormField
                            control={form.control}
                            name="goalId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("goal")}</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t("selectGoal")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {goals.map((goal) => (
                                                <SelectItem key={goal.id} value={goal.id}>
                                                    {goal.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("operationType")}</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(SavingsOperationType).map((value) => (
                                                <SelectItem key={value} value={value}>
                                                    {t(value)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="storage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {type === SavingsOperationType.TRANSFER ? t("fromStorage") : t("storage")}
                                        </FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(SavingsStorage).map((value) => (
                                                    <SelectItem key={value} value={value}>
                                                        {t(value)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {type === SavingsOperationType.TRANSFER ? (
                                <FormField
                                    control={form.control}
                                    name="destinationStorage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("toStorage")}</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(SavingsStorage)
                                                        .filter((value) => value !== storage)
                                                        .map((value) => (
                                                            <SelectItem key={value} value={value}>
                                                                {t(value)}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("date")}</FormLabel>
                                            <FormControl>
                                                <DatePicker value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {type === SavingsOperationType.TRANSFER && (
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("date")}</FormLabel>
                                        <FormControl>
                                            <DatePicker value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("amount")}</FormLabel>
                                    <FormControl>
                                        <Input inputMode="decimal" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("note")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            className="min-h-20 resize-none"
                                            placeholder={t("notePlaceholder")}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    {t("cancel")}
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isPending || !form.formState.isValid}>
                                {t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
