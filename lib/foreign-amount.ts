import { CURRENCY } from "../constants/index";
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

type ForeignAmount = {
    currency?: CURRENCY;
    currencyAmount?: number;
};

export const isForeignAmount = <T extends ForeignAmount>(
    item: T,
    userCurrency: CURRENCY,
): item is T & { currency: CURRENCY; currencyAmount: number } =>
    Boolean(item.currency) && item.currency !== userCurrency && typeof item.currencyAmount === "number";

export const currentForeignAmount = (
    item: ForeignAmount & { amount: number },
    userCurrency: CURRENCY,
    rates: ExchangeRates,
): number => {
    if (!isForeignAmount(item, userCurrency)) return item.amount;
    return convertToUserCurrency(item.currencyAmount, item.currency, userCurrency, rates) ?? item.amount;
};

export const toStoredMoney = (
    entered: number,
    currency: CURRENCY,
    userCurrency: CURRENCY,
    rates: ExchangeRates,
): { amount: number; currency?: CURRENCY; currencyAmount?: number } | null => {
    if (currency === userCurrency) return { amount: entered, currency: undefined, currencyAmount: undefined };

    const amount = convertToUserCurrency(entered, currency, userCurrency, rates);
    return amount === null ? null : { amount, currency, currencyAmount: entered };
};
