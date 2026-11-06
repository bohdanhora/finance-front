"use client";

import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

import { EssentialFormValues } from "components/essential-category-field";
import { CURRENCY } from "constants/index";
import { useExchangeRates } from "hooks/use-exchange-rates";
import { getCurrencySymbol } from "lib/currency";
import { convertToUserCurrency, isForeignAmount } from "lib/foreign-amount";
import { toMoneyInput } from "lib/money";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import useStore from "store/general";
import { EssentialType } from "types/transactions";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

export const getEmptyEssentialValues = (currency: CURRENCY): EssentialFormValues => ({
    amount: "",
    title: "",
    category: "",
    currency,
});

export const getEssentialFormValues = (essential: EssentialType, userCurrency: CURRENCY): EssentialFormValues => {
    const foreign = isForeignAmount(essential, userCurrency);

    return {
        amount: toMoneyInput(foreign ? essential.currencyAmount! : essential.amount),
        title: essential.title,
        category: essential.category ?? "",
        currency: foreign ? essential.currency! : userCurrency,
    };
};

export const EssentialAmountField = ({
    form,
    disabled,
}: {
    form: UseFormReturn<EssentialFormValues>;
    disabled?: boolean;
}) => {
    const t = useTranslations("dialogs");
    const userCurrency = useStore((state) => state.userCurrency);
    const rates = useExchangeRates("sell");

    const currency = form.watch("currency");
    const entered = Number(form.watch("amount")) || 0;
    const symbol = getCurrencySymbol(userCurrency);
    const isForeign = currency !== userCurrency;
    const preview = isForeign && entered > 0 ? convertToUserCurrency(entered, currency, userCurrency, rates) : null;

    return (
        <>
            <div className="flex gap-3">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem className="min-w-0 flex-1">
                            <FormLabel>{t("amount")}</FormLabel>
                            <FormControl>
                                <Input
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    disabled={disabled}
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
                        <FormItem className="w-20 shrink-0">
                            <FormLabel>{t("essentials.currencyLabel")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                                <FormControl>
                                    <SelectTrigger className="w-full" aria-label={t("essentials.currencyLabel")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.values(CURRENCY).map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {getCurrencySymbol(value)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            </div>
            {isForeign && !disabled && (
                <p className="text-ink-faint -mt-2 font-mono text-2xs tabular-nums">
                    {preview !== null
                        ? t("essentials.convertedPreview", { amount: formatCurrency(preview), currency: symbol })
                        : t("essentials.foreignHint", { currency: symbol })}
                </p>
            )}
        </>
    );
};
