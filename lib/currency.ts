import { CURRENCY } from "constants/index";

export const convertCurrency = (value: number, rate: number): number => {
    return rate ? value / rate : 0;
};

export const getCurrencySymbol = (currency: CURRENCY): string => {
    switch (currency) {
        case CURRENCY.USD:
            return "$";
        case CURRENCY.EUR:
            return "€";
        default:
            return "";
    }
};

export const convertToAllCurrencies = (
    value: number,
    rates: { [key in CURRENCY]?: number },
): Record<CURRENCY | "default", number> => {
    return {
        default: value,
        [CURRENCY.EUR]: convertCurrency(value, rates[CURRENCY.EUR] || 0),
        [CURRENCY.USD]: convertCurrency(value, rates[CURRENCY.USD] || 0),
    };
};
