"use client";

import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

import { EssentialFormValues } from "components/essential-category-field";
import useStore from "store/general";
import { EssentialType } from "types/transactions";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

const NO_SOURCE = "none";

export const planFieldsFromForm = (
    values: Pick<EssentialFormValues, "day" | "fundedBy">,
): Pick<EssentialType, "day" | "fundedBy"> => ({
    day: values.day ? Number(values.day) : undefined,
    fundedBy: values.fundedBy || undefined,
});

export const EssentialPlanFields = ({ form }: { form: UseFormReturn<EssentialFormValues> }) => {
    const t = useTranslations("dialogs.essentials");
    const incomes = useStore((state) => state.expectedIncomes);

    return (
        <div className="flex gap-3">
            <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                    <FormItem className="w-24 shrink-0">
                        <FormLabel>{t("dueDay")}</FormLabel>
                        <FormControl>
                            <Input
                                inputMode="numeric"
                                placeholder="15"
                                {...field}
                                onChange={(event) => field.onChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="fundedBy"
                render={({ field }) => (
                    <FormItem className="min-w-0 flex-1">
                        <FormLabel>{t("fundedBy")}</FormLabel>
                        <Select
                            value={field.value || NO_SOURCE}
                            onValueChange={(value) => field.onChange(value === NO_SOURCE ? "" : value)}
                        >
                            <FormControl>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value={NO_SOURCE}>{t("fundedByAny")}</SelectItem>
                                {incomes.map((income) => (
                                    <SelectItem key={income.id} value={income.id}>
                                        {income.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
        </div>
    );
};

export const usePlanMeta = () => {
    const t = useTranslations("dialogs.essentials");
    const incomes = useStore((state) => state.expectedIncomes);

    return (essential: Pick<EssentialType, "day" | "fundedBy">) => {
        const source = incomes.find((income) => income.id === essential.fundedBy);
        return [
            essential.day ? t("dueOn", { day: essential.day }) : null,
            source ? t("fromIncome", { title: source.title }) : null,
        ]
            .filter(Boolean)
            .map((part) => ` · ${part}`)
            .join("");
    };
};
