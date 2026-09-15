import z from "zod";
import { SavingsStorage } from "types/transactions";

const amountRegex = /^(0|[1-9]\d*)(\.\d{0,2})?$/;

const amountMorethanZero = (val?: string) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
};

export const changeDefaultFormSchema = z.object({
    amount: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    title: z.string().min(1),
});

export const changeNextMonthFormSchema = z
    .object({
        rate: z.string(),
        hours: z.string(),
        amount: z.string(),
        currency: z.string().optional(),
    })
    .superRefine(({ rate, hours, amount }, ctx) => {
        const byRate = rate !== "" || hours !== "";

        if (byRate && !amountMorethanZero(rate)) ctx.addIssue({ code: "custom", path: ["rate"] });
        if (byRate && !amountMorethanZero(hours)) ctx.addIssue({ code: "custom", path: ["hours"] });
        if (!byRate && !amountMorethanZero(amount)) ctx.addIssue({ code: "custom", path: ["amount"] });
        if (amount !== "" && !amountRegex.test(amount)) ctx.addIssue({ code: "custom", path: ["amount"] });
    });

export const setPercentageFormSchema = z.object({
    value: z.string().min(0).regex(amountRegex),
});

export const essentialSpendsFormSchema = z.object({
    amount: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    title: z.string().min(1),
});

export const expectedIncomeFormSchema = z.object({
    amount: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    title: z.string().trim().min(1).max(80),
    day: z.string().regex(/^([1-9]|[12]\d|3[01])$/),
    recurring: z.boolean(),
});

export const incomeFormSchema = z.object({
    value: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    description: z.string().optional(),
    date: z.date(),
});

export const getIncomeFormSchema = (totalAmount: number) => {
    return z.object({
        value: z
            .string()
            .min(1)
            .regex(amountRegex)
            .refine(amountMorethanZero)
            .refine((val) => {
                const num = Number(val);
                return num <= totalAmount;
            }),

        description: z.string().optional(),
        categories: z.string().trim().min(1).max(40),
        savingsStorage: z.nativeEnum(SavingsStorage),
        date: z.date(),
    });
};
