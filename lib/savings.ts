import { CURRENCY } from "constants/index";
import { SavingsOperation, SavingsOperationType, SavingsStorage } from "types/transactions";

type ExchangeRates = {
    usdToUah: number;
    eurToUah: number;
};

const AVERAGE_DAYS_PER_MONTH = 365.2425 / 12;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type SavingsPace = {
    daysRemaining: number;
    dailyAmount: number;
    monthlyAmount: number;
    isOverdue: boolean;
};

const roundUpCurrency = (value: number) => Math.ceil((value - Number.EPSILON) * 100) / 100;

export const calculateSavingsPace = (
    amountRemaining: number,
    targetDate?: string,
    today = new Date(),
): SavingsPace | null => {
    if (!targetDate) return null;

    const [year, month, day] = targetDate.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) return null;

    const targetTimestamp = Date.UTC(year, month - 1, day);
    const todayTimestamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const rawDaysRemaining = Math.ceil((targetTimestamp - todayTimestamp) / MILLISECONDS_PER_DAY);
    const remaining = Math.max(Number.isFinite(amountRemaining) ? amountRemaining : 0, 0);

    if (rawDaysRemaining < 0) {
        return {
            daysRemaining: 0,
            dailyAmount: remaining,
            monthlyAmount: remaining,
            isOverdue: true,
        };
    }

    const daysRemaining = Math.max(rawDaysRemaining, 1);
    const dailyAmount = roundUpCurrency(remaining / daysRemaining);
    const monthlyAmount = Math.min(remaining, roundUpCurrency(dailyAmount * AVERAGE_DAYS_PER_MONTH));

    return { daysRemaining, dailyAmount, monthlyAmount, isOverdue: false };
};

const getOperationStorageAmount = (operation: SavingsOperation, storage?: SavingsStorage) => {
    if (operation.type === SavingsOperationType.DEPOSIT) {
        return !storage || operation.storage === storage ? operation.amount : 0;
    }

    if (operation.type === SavingsOperationType.WITHDRAWAL) {
        return !storage || operation.storage === storage ? -operation.amount : 0;
    }

    if (!storage) return 0;
    if (operation.storage === storage) return -operation.amount;
    if (operation.destinationStorage === storage) return operation.amount;
    return 0;
};

export const getSavingsNativeBalance = (operations: SavingsOperation[], currency: CURRENCY, storage: SavingsStorage) =>
    operations
        .filter((operation) => operation.currency === currency)
        .reduce((total, operation) => total + getOperationStorageAmount(operation, storage), 0);

export const convertSavingsCurrency = (
    amount: number,
    from: CURRENCY,
    to: CURRENCY,
    rates: ExchangeRates,
): number | null => {
    if (from === to) return amount;

    const fromRate = from === CURRENCY.UAH ? 1 : from === CURRENCY.USD ? rates.usdToUah : rates.eurToUah;
    const toRate = to === CURRENCY.UAH ? 1 : to === CURRENCY.USD ? rates.usdToUah : rates.eurToUah;

    if (fromRate <= 0 || toRate <= 0) return null;
    return (amount * fromRate) / toRate;
};

/**
 * Returns the shared savings balance in one currency. Transfers only change
 * the selected storage balance and never change the overall savings total.
 */
export const getSavingsBalance = (
    operations: SavingsOperation[],
    currency: CURRENCY,
    rates: ExchangeRates,
    storage?: SavingsStorage,
): number | null => {
    const converted = operations.map((operation) => {
        const amount = getOperationStorageAmount(operation, storage);
        if (amount === 0) return 0;
        return convertSavingsCurrency(amount, operation.currency, currency, rates);
    });

    if (converted.some((value) => value === null)) return null;
    return (converted as number[]).reduce((total, value) => total + value, 0);
};
