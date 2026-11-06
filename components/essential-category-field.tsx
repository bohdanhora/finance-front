"use client";

import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

import { CURRENCY } from "constants/index";
import { CategoryCombobox } from "components/categories/category-combobox";
import { FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { suggestEssentialCategory } from "lib/essential-category";

export type EssentialFormValues = { title: string; amount: string; category: string; currency: CURRENCY };

export const useCategorySuggestion = (form: UseFormReturn<EssentialFormValues>) => {
    const touchedRef = useRef(false);
    const title = form.watch("title");

    useEffect(() => {
        if (touchedRef.current) return;
        form.setValue("category", suggestEssentialCategory(title) ?? "", { shouldDirty: true });
    }, [form, title]);

    return {
        setTouched: (touched: boolean) => {
            touchedRef.current = touched;
        },
    };
};

export const EssentialCategoryField = ({
    form,
    onPick,
}: {
    form: UseFormReturn<EssentialFormValues>;
    onPick: () => void;
}) => {
    const t = useTranslations("dialogs");

    return (
        <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <CategoryCombobox
                        value={field.value}
                        excludedKeys={["savings", "transfers"]}
                        onChange={(value) => {
                            onPick();
                            field.onChange(value);
                        }}
                    />
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
