import z from "zod";
import { CURRENCY } from "constants/index";
import { SavingsStorage } from "types/transactions";
import { ValidationMessages } from "lib/validation";

const amountRegex = /^(0|[1-9]\d*)(\.\d{0,2})?$/;
const rateRegex = /^(0|[1-9]\d*)(\.\d{0,4})?$/;

const amountMorethanZero = (val?: string) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
};

const amountField = (messages: ValidationMessages) =>
    z.string().min(1, messages.amount).regex(amountRegex, messages.amountFormat).refine(amountMorethanZero, {
        message: messages.amount,
    });

const titleField = (messages: ValidationMessages, max?: number) => {
    const field = z.string().trim().min(1, messages.title);
    return max ? field.max(max, messages.titleTooLong(max)) : field;
};

export const changeDefaultFormSchema = (messages: ValidationMessages) =>
    z.object({
        amount: amountField(messages),
        title: titleField(messages),
    });

export const changeNextMonthFormSchema = (messages: ValidationMessages) =>
    z.object({
        payments: z
            .array(
                z
                    .object({
                        mode: z.enum(["fixed", "rate"]),
                        rate: z.string(),
                        hours: z.string(),
                        amount: z.string(),
                        currency: z.nativeEnum(CURRENCY, messages.currency),
                    })
                    .superRefine(({ mode, rate, hours, amount }, ctx) => {
                        if (mode === "rate") {
                            if (!amountMorethanZero(rate))
                                ctx.addIssue({ code: "custom", path: ["rate"], message: messages.rate });
                            if (!amountMorethanZero(hours))
                                ctx.addIssue({ code: "custom", path: ["hours"], message: messages.hours });
                            return;
                        }

                        if (!amountMorethanZero(amount))
                            ctx.addIssue({ code: "custom", path: ["amount"], message: messages.amount });
                        else if (!amountRegex.test(amount))
                            ctx.addIssue({ code: "custom", path: ["amount"], message: messages.amountFormat });
                    }),
            )
            .min(1),
    });

export const setPercentageFormSchema = (messages: ValidationMessages) =>
    z.object({
        value: z.string().min(1, messages.percent).regex(amountRegex, messages.percent),
    });

export const setTotalFormSchema = (messages: ValidationMessages) =>
    z.object({
        value: z.string().min(1, messages.amount).regex(amountRegex, messages.amountFormat),
    });

export const essentialSpendsFormSchema = (messages: ValidationMessages) =>
    z.object({
        amount: amountField(messages),
        title: titleField(messages),
    });

export const expectedIncomeFormSchema = (messages: ValidationMessages) =>
    z.object({
        amount: amountField(messages),
        title: titleField(messages, 80),
        day: z.string().regex(/^([1-9]|[12]\d|3[01])$/, messages.day),
        recurring: z.boolean(),
        currency: z.nativeEnum(CURRENCY, messages.currency),
    });

export const incomeFormSchema = (messages: ValidationMessages) =>
    z.object({
        value: amountField(messages),
        description: z.string().optional(),
        date: z.date(messages.date),
    });

type ExpenseSchemaOptions = {
    totalAmount: number;
    balanceLabel: string;
    userCurrency: CURRENCY;
};

export const getExpenseFormSchema = (
    messages: ValidationMessages,
    { totalAmount, balanceLabel, userCurrency }: ExpenseSchemaOptions,
) =>
    z
        .object({
            value: amountField(messages).refine((val) => Number(val) <= totalAmount, {
                message: messages.notEnoughFunds(balanceLabel),
            }),
            description: z.string().optional(),
            categories: z.string().trim().min(1, messages.category).max(40, messages.category),
            savingsStorage: z.nativeEnum(SavingsStorage, messages.storage),
            savingsCurrency: z.nativeEnum(CURRENCY, messages.currency),
            savingsRate: z.string(),
            date: z.date(messages.date),
        })
        .superRefine(({ categories, savingsCurrency, savingsRate }, ctx) => {
            if (categories !== "savings" || savingsCurrency === userCurrency) return;

            if (!rateRegex.test(savingsRate) || !amountMorethanZero(savingsRate))
                ctx.addIssue({ code: "custom", path: ["savingsRate"], message: messages.exchangeRate });
        });

export const editTransactionFormSchema = (messages: ValidationMessages, userCurrency: CURRENCY) =>
    z
        .object({
            value: amountField(messages),
            categories: z.string().trim().min(1, messages.category).max(40, messages.category),
            savingsStorage: z.nativeEnum(SavingsStorage, messages.storage),
            savingsCurrency: z.nativeEnum(CURRENCY, messages.currency),
            savingsRate: z.string(),
            date: z.date(messages.date),
            description: z.string().optional(),
        })
        .superRefine(({ categories, savingsCurrency, savingsRate }, ctx) => {
            if (categories !== "savings" || savingsCurrency === userCurrency) return;

            if (!rateRegex.test(savingsRate) || !amountMorethanZero(savingsRate))
                ctx.addIssue({ code: "custom", path: ["savingsRate"], message: messages.exchangeRate });
        });
