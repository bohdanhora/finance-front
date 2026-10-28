import { CURRENCY } from "../constants/index";
import { ExpectedIncome } from "../types/transactions";
import { roundMoney } from "./money";
import { convertSavingsCurrency } from "./savings";

type ExchangeRates = {
    usdToUah: number;
    eurToUah: number;
};

export const convertToUserCurrency = (
    amount: number,
    currency: CURRENCY,
    userCurrency: CURRENCY,
    rates: ExchangeRates,
): number | null => {
    const converted = convertSavingsCurrency(amount, currency, userCurrency, rates);
    return converted === null ? null : roundMoney(converted);
};

export const isForeignIncome = (
    income: Pick<ExpectedIncome, "currency" | "currencyAmount">,
    userCurrency: CURRENCY,
): income is Pick<ExpectedIncome, "currency" | "currencyAmount"> & { currency: CURRENCY; currencyAmount: number } =>
    Boolean(income.currency) && income.currency !== userCurrency && typeof income.currencyAmount === "number";

export const currentIncomeAmount = (
    income: Pick<ExpectedIncome, "amount" | "currency" | "currencyAmount">,
    userCurrency: CURRENCY,
    rates: ExchangeRates,
): number => {
    if (!isForeignIncome(income, userCurrency)) return income.amount;
    return convertToUserCurrency(income.currencyAmount, income.currency, userCurrency, rates) ?? income.amount;
};
