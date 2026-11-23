import dayjs from "dayjs";

import { CURRENCY } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { calculateSavingsPace, convertSavingsCurrency, getSavingsBalance } from "lib/savings";
import { formatCurrency } from "lib/utils";
import { SavingsGoal, SavingsOperation } from "types/transactions";

export type GoalRates = { usdToUah: number; eurToUah: number };

export const goalMoney = (value: number, currency: CURRENCY) =>
    `${formatCurrency(value)} ${getCurrencySymbol(currency)}`;

export const getGoalSummary = (
    goal: SavingsGoal,
    operations: SavingsOperation[],
    rates: GoalRates,
    displayCurrency: CURRENCY,
) => {
    const sharedSavings = getSavingsBalance(operations, goal.currency, rates);
    const saved = Math.max(sharedSavings ?? 0, 0);
    const covered = Math.min(saved, goal.targetAmount);
    const missing = Math.max(goal.targetAmount - saved, 0);
    const afterPurchase = Math.max(saved - goal.targetAmount, 0);
    const canAfford = sharedSavings !== null && saved >= goal.targetAmount;
    const savingsPace = calculateSavingsPace(missing, goal.targetDate);
    const activePace = savingsPace && !savingsPace.isOverdue ? savingsPace : null;
    const monthlyContribution = activePace ? activePace.monthlyAmount : goal.monthlyContribution;
    const progress = goal.targetAmount > 0 ? Math.min((covered / goal.targetAmount) * 100, 100) : 0;
    const comparisonCurrency =
        goal.currency === CURRENCY.UAH
            ? displayCurrency === CURRENCY.UAH
                ? CURRENCY.USD
                : displayCurrency
            : CURRENCY.UAH;
    const convertedTarget = convertSavingsCurrency(goal.targetAmount, goal.currency, comparisonCurrency, rates);

    return {
        ratesAvailable: sharedSavings !== null,
        covered,
        missing,
        afterPurchase,
        canAfford,
        activePace,
        monthlyContribution,
        progress,
        comparisonCurrency,
        convertedTarget,
        targetDate: goal.targetDate ? dayjs(goal.targetDate).format("DD.MM.YYYY") : null,
    };
};
