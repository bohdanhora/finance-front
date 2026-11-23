import { CURRENCY } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { convertSavingsCurrency } from "lib/savings";
import { formatCurrency } from "lib/utils";
import { SavingsGoalPriceResponse } from "types/transactions";

type Rates = { usdToUah: number; eurToUah: number };

const KNOWN_CURRENCIES: Record<string, CURRENCY> = {
    UAH: CURRENCY.UAH,
    USD: CURRENCY.USD,
    EUR: CURRENCY.EUR,
};

export const MEANINGFUL_PRICE_DIFFERENCE = 0.5;

export const parseSiteCurrency = (code?: string): CURRENCY | undefined =>
    code ? KNOWN_CURRENCIES[code.toUpperCase()] : undefined;

export const formatSitePrice = (price: number, code?: string) => {
    const currency = parseSiteCurrency(code);
    if (currency) return `${formatCurrency(price)} ${getCurrencySymbol(currency)}`;
    return `${formatCurrency(price)}${code ? ` ${code}` : ""}`;
};

export const sitePriceIn = (
    data: SavingsGoalPriceResponse | undefined,
    target: CURRENCY,
    rates: Rates,
): number | null => {
    if (!data || data.price === null) return null;
    const currency = parseSiteCurrency(data.currency);
    return currency ? convertSavingsCurrency(data.price, currency, target, rates) : null;
};
