import z from "zod";

const amountRegex = /^(0|[1-9]\d*)(\.\d{0,2})?$/;

const amountMorethanZero = (val?: string) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
};

export const changeDefaultFormSchema = z.object({
    amount: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    title: z.string().min(1),
});

export const changeNextMonthFormSchema = z.object({
    value: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
});

export const essentialSpendsFormSchema = z.object({
    amount: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    title: z.string().min(1),
});

export const incomeFormSchema = z.object({
    value: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    description: z.string().optional(),
    date: z.date(),
});

export const nextMonthIncomeFormSchema = z.object({
    rate: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    hours: z.string().min(1).regex(amountRegex).refine(amountMorethanZero),
    customValue: z.string().optional().refine(amountMorethanZero),
    currency: z.string().optional(),
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
        categories: z.string().min(1),
        date: z.date(),
    });
};
