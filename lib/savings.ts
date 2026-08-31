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

export const getStorageBalance = (operations: SavingsOperation[], storage: SavingsStorage, goalId?: string) =>
    operations
        .filter((operation) => !goalId || operation.goalId === goalId)
        .reduce((total, operation) => {
            if (operation.type === SavingsOperationType.DEPOSIT) {
                return operation.storage === storage ? total + operation.amount : total;
            }

            if (operation.type === SavingsOperationType.WITHDRAWAL) {
                return operation.storage === storage ? total - operation.amount : total;
            }

            if (operation.storage === storage) return total - operation.amount;
            if (operation.destinationStorage === storage) return total + operation.amount;
            return total;
        }, 0);

export const getGoalSaved = (operations: SavingsOperation[], goalId: string) =>
    getStorageBalance(operations, SavingsStorage.CASH, goalId) +
    getStorageBalance(operations, SavingsStorage.CARD, goalId);

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
