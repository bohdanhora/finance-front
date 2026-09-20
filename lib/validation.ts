import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";

export type ValidationMessages = {
    required: string;
    invalidValue: string;
    amount: string;
    amountFormat: string;
    notEnoughFunds: (amount: string) => string;
    title: string;
    titleTooLong: (max: number) => string;
    category: string;
    date: string;
    futureDate: string;
    percent: string;
    day: string;
    rate: string;
    hours: string;
    exchangeRate: string;
    url: string;
    storage: string;
    currency: string;
    sameStorage: string;
    note: (max: number) => string;
};

export const useValidationMessages = (): ValidationMessages => {
    const t = useTranslations("validation");

    return useMemo(
        () => ({
            required: t("required"),
            invalidValue: t("invalidValue"),
            amount: t("amount"),
            amountFormat: t("amountFormat"),
            notEnoughFunds: (amount: string) => t("notEnoughFunds", { amount }),
            title: t("title"),
            titleTooLong: (max: number) => t("titleTooLong", { max }),
            category: t("category"),
            date: t("date"),
            futureDate: t("futureDate"),
            percent: t("percent"),
            day: t("day"),
            rate: t("rate"),
            hours: t("hours"),
            exchangeRate: t("exchangeRate"),
            url: t("url"),
            storage: t("storage"),
            currency: t("currency"),
            sameStorage: t("sameStorage"),
            note: (max: number) => t("note", { max }),
        }),
        [t],
    );
};

export const createZodErrorMap =
    (messages: ValidationMessages): z.core.$ZodErrorMap =>
    (issue) => {
        if (issue.code === "invalid_type" || issue.input === undefined || issue.input === "") {
            return messages.required;
        }

        if (issue.code === "too_small" && Number(issue.minimum) <= 1) return messages.required;

        return messages.invalidValue;
    };
