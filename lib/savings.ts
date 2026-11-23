import { CURRENCY } from "../constants/index";
import { SavingsGoal, SavingsOperation, SavingsOperationType, SavingsStorage } from "../types/transactions";
import { roundMoney } from "./money";

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
    const remaining = roundMoney(Math.max(Number.isFinite(amountRemaining) ? amountRemaining : 0, 0));

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

export const normalizeGoalUrl = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
        const url = new URL(withProtocol);
        return url.hostname.includes(".") && !/\s/.test(url.hostname) ? url.href : null;
    } catch {
        return null;
    }
};

export const GOAL_LINKS_LIMIT = 5;

export const goalLinks = (goal: Pick<SavingsGoal, "links" | "url">): string[] =>
    goal.links?.length ? goal.links : goal.url ? [goal.url] : [];

export const getUrlHost = (value: string): string => {
    try {
        return new URL(value).hostname.replace(/^www\./, "");
    } catch {
        return value;
    }
};

const GOAL_NAME_LIMIT = 80;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /[A-Za-z]/;

const balanceBrackets = (value: string) => {
    let text = value;
    for (const [open, close] of [
        ["(", ")"],
        ["[", "]"],
    ]) {
        const opens = text.split(open).length - 1;
        const closes = text.split(close).length - 1;
        if (opens > closes) text = text.slice(0, text.lastIndexOf(open));
        if (closes > opens && text.startsWith(close)) text = text.slice(1);
    }
    return text;
};

const tidyName = (value: string) => {
    const edges = /^[\s,.;:/|-]+|[\s,.;:/|-]+$/g;
    return balanceBrackets(value.replace(edges, ""))
        .replace(edges, "")
        .replace(/\s+/g, " ")
        .slice(0, GOAL_NAME_LIMIT)
        .trim();
};

export const goalNameFromTitle = (title?: string): string => {
    if (!title) return "";
    const main = title.split(/\s+(?:\||(?!-)\p{Pd})\s+|\s+-\s+(?=[^-]*$)/u)[0] ?? title;
    const tokens = main.trim().split(/\s+/);

    let best: string[] = [];
    let run: string[] = [];
    for (const token of [...tokens, ""]) {
        if (token && !CYRILLIC.test(token)) {
            run.push(token);
            continue;
        }
        if (run.some((word) => LATIN.test(word)) && run.length > best.length) best = run;
        run = [];
    }

    const english = tidyName(best.join(" "));
    return english && LATIN.test(english) ? english : tidyName(main);
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

export const getSavingsNativeBalance = (operations: SavingsOperation[], currency: CURRENCY, storage?: SavingsStorage) =>
    roundMoney(
        operations
            .filter((operation) => operation.currency === currency)
            .reduce((total, operation) => total + getOperationStorageAmount(operation, storage), 0),
    );

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
    return roundMoney((converted as number[]).reduce((total, value) => total + value, 0));
};

export const getExchangeRate = (from: CURRENCY, to: CURRENCY, rates: ExchangeRates): number | null =>
    convertSavingsCurrency(1, from, to, rates);
