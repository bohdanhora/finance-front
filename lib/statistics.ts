import dayjs from "dayjs";

import { TransactionEnum } from "../constants/index";
import { TransactionType } from "../types/transactions";
import { isEssentialTransaction } from "./essential-category";

export type MonthKey = string;

export const toMonthKey = (date: string | Date): MonthKey => dayjs(date).format("YYYY-MM");

export const listMonths = (transactions: TransactionType[]): MonthKey[] => {
    const keys = new Set(transactions.map((tx) => toMonthKey(tx.date)));
    keys.add(toMonthKey(new Date()));
    return [...keys].sort((a, b) => b.localeCompare(a));
};

export const filterByMonth = (transactions: TransactionType[], month: MonthKey): TransactionType[] =>
    transactions.filter((tx) => toMonthKey(tx.date) === month);

const isExpense = (tx: TransactionType) => tx.transactionType === TransactionEnum.EXPENSE;
const isIncome = (tx: TransactionType) => tx.transactionType === TransactionEnum.INCOME;

const sum = (items: TransactionType[]) => items.reduce((acc, tx) => acc + tx.value, 0);

export type MonthTotals = {
    income: number;
    expense: number;
    net: number;
    count: number;
    averageExpense: number;
    medianExpense: number;
    largestExpense: TransactionType | null;
};

export const median = (values: number[]) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const monthTotals = (transactions: TransactionType[]): MonthTotals => {
    const expenses = transactions.filter(isExpense);
    const incomes = transactions.filter(isIncome);

    const expenseTotal = sum(expenses);

    const largestExpense = expenses.reduce<TransactionType | null>(
        (max, tx) => (!max || tx.value > max.value ? tx : max),
        null,
    );

    return {
        income: sum(incomes),
        expense: expenseTotal,
        net: sum(incomes) - expenseTotal,
        count: transactions.length,
        averageExpense: expenses.length ? expenseTotal / expenses.length : 0,
        medianExpense: median(expenses.map((tx) => tx.value)),
        largestExpense,
    };
};

export type CategorySlice = {
    name: string;
    value: number;
    percent: number;
};

export const byCategory = (transactions: TransactionType[]): CategorySlice[] => {
    const totals = new Map<string, number>();

    transactions.filter(isExpense).forEach((tx) => {
        totals.set(tx.categorie, (totals.get(tx.categorie) ?? 0) + tx.value);
    });

    const grandTotal = [...totals.values()].reduce((acc, value) => acc + value, 0);

    return [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
            name,
            value,
            percent: grandTotal ? +((value / grandTotal) * 100).toFixed(1) : 0,
        }));
};

export type MonthPoint = {
    month: MonthKey;
    label: string;
    income: number;
    expense: number;
};

export const byMonth = (transactions: TransactionType[], upTo: MonthKey, count = 6): MonthPoint[] => {
    const end = dayjs(`${upTo}-01`);

    return Array.from({ length: count }, (_, index) => {
        const cursor = end.subtract(count - 1 - index, "month");
        const key = cursor.format("YYYY-MM");
        const inMonth = filterByMonth(transactions, key);

        return {
            month: key,
            label: cursor.format("MMM"),
            income: sum(inMonth.filter(isIncome)),
            expense: sum(inMonth.filter(isExpense)),
        };
    });
};

export const cumulativeNet = (points: { income: number; expense: number }[]): number[] => {
    let running = 0;
    return points.map((point) => {
        running += point.income - point.expense;
        return running;
    });
};

const SAVINGS_CATEGORY = "savings";

export type MonthResult = {
    net: number;
    kept: number;
    keptShare: number | null;
    movedToSavings: number;
};

export const monthResult = (transactions: TransactionType[]): MonthResult => {
    const totals = monthTotals(transactions);
    const movedToSavings = sum(transactions.filter((tx) => isExpense(tx) && tx.categorie === SAVINGS_CATEGORY));
    const kept = totals.net + movedToSavings;

    return {
        net: totals.net,
        kept,
        keptShare: totals.income > 0 ? (kept / totals.income) * 100 : null,
        movedToSavings,
    };
};

export type EssentialSplit = {
    essential: number;
    flexible: number;
    essentialShare: number;
    essentialCount: number;
    categories: CategorySlice[];
};

export const essentialSplit = (transactions: TransactionType[]): EssentialSplit => {
    const spending = transactions.filter((tx) => isExpense(tx) && tx.categorie !== SAVINGS_CATEGORY);
    const essentials = spending.filter(isEssentialTransaction);
    const essential = sum(essentials);
    const total = sum(spending);

    return {
        essential,
        flexible: total - essential,
        essentialShare: total > 0 ? (essential / total) * 100 : 0,
        essentialCount: essentials.length,
        categories: byCategory(essentials),
    };
};

export const excludeCategories = (transactions: TransactionType[], hidden: ReadonlySet<string>): TransactionType[] =>
    hidden.size ? transactions.filter((tx) => !(isExpense(tx) && hidden.has(tx.categorie))) : transactions;

export type HiddenSummary = {
    categories: CategorySlice[];
    total: number;
};

export const hiddenSummary = (transactions: TransactionType[], hidden: ReadonlySet<string>): HiddenSummary => {
    const categories = byCategory(transactions.filter((tx) => isExpense(tx) && hidden.has(tx.categorie)));
    return { categories, total: categories.reduce((acc, slice) => acc + slice.value, 0) };
};

export const expenseCategories = (transactions: TransactionType[]): string[] =>
    [...new Set(transactions.filter(isExpense).map((tx) => tx.categorie))].sort();

export type SpendingGroup = {
    key: string;
    label: string;
    value: number;
    count: number;
    percent: number;
    lastDate: string;
    categories: string[];
};

export const descriptionKey = (description: string) => description.trim().replace(/\s+/g, " ").toLowerCase();

export const groupByDescription = (transactions: TransactionType[]): SpendingGroup[] => {
    const groups = new Map<string, SpendingGroup>();
    const items = transactions.filter(isExpense);
    const total = sum(items);

    items.forEach((tx) => {
        const key = descriptionKey(tx.description ?? "");
        const group = groups.get(key);
        if (group) {
            group.value += tx.value;
            group.count += 1;
            if (dayjs(tx.date).isAfter(group.lastDate)) group.lastDate = tx.date;
            if (!group.categories.includes(tx.categorie)) group.categories.push(tx.categorie);
        } else {
            groups.set(key, {
                key,
                label: (tx.description ?? "").trim(),
                value: tx.value,
                count: 1,
                percent: 0,
                lastDate: tx.date,
                categories: [tx.categorie],
            });
        }
    });

    return [...groups.values()]
        .map((group) => ({ ...group, percent: total ? +((group.value / total) * 100).toFixed(1) : 0 }))
        .sort((a, b) => b.value - a.value);
};

export const categoryDetails = (transactions: TransactionType[], category: string): SpendingGroup[] =>
    groupByDescription(transactions.filter((tx) => tx.categorie === category));

export const searchTransactions = (
    transactions: TransactionType[],
    query: string,
    categoryLabel: (category: string) => string,
): TransactionType[] => {
    const needle = query.trim().toLowerCase();
    if (!needle) return transactions;

    return transactions.filter(
        (tx) =>
            (tx.description ?? "").toLowerCase().includes(needle) ||
            categoryLabel(tx.categorie).toLowerCase().includes(needle),
    );
};

export type CategoryDelta = {
    previous: number;
    change: number;
};

export const categoryDeltas = (current: CategorySlice[], previous: CategorySlice[]): Map<string, CategoryDelta> => {
    const before = new Map(previous.map((slice) => [slice.name, slice.value]));

    return new Map(
        current.map((slice) => {
            const value = before.get(slice.name) ?? 0;
            return [slice.name, { previous: value, change: slice.value - value }];
        }),
    );
};

export type WeekdayPoint = {
    weekday: number;
    value: number;
    count: number;
    percent: number;
};

export const weekdaySpending = (transactions: TransactionType[]) => {
    const points: WeekdayPoint[] = Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        value: 0,
        count: 0,
        percent: 0,
    }));

    transactions.filter(isExpense).forEach((tx) => {
        const point = points[(dayjs(tx.date).day() + 6) % 7];
        point.value += tx.value;
        point.count += 1;
    });

    const total = points.reduce((acc, point) => acc + point.value, 0);
    points.forEach((point) => {
        point.percent = total ? +((point.value / total) * 100).toFixed(1) : 0;
    });

    return {
        points,
        total,
        weekendShare: total ? ((points[5].value + points[6].value) / total) * 100 : 0,
    };
};

export type CategoryHistoryPoint = {
    month: MonthKey;
    value: number;
};

export const categoryHistory = (
    transactions: TransactionType[],
    category: string,
    upTo: MonthKey,
    count = 6,
): { points: CategoryHistoryPoint[]; average: number } => {
    const items = transactions.filter((tx) => isExpense(tx) && tx.categorie === category);
    const points = byMonth(items, upTo, count).map((point) => ({ month: point.month, value: point.expense }));
    const earlier = points.slice(0, -1).filter((point) => point.value > 0);

    return {
        points,
        average: earlier.length ? earlier.reduce((acc, point) => acc + point.value, 0) / earlier.length : 0,
    };
};

export const busiestDay = (transactions: TransactionType[]) => {
    const days = new Map<string, number>();
    transactions.filter(isExpense).forEach((tx) => {
        const key = dayjs(tx.date).format("YYYY-MM-DD");
        days.set(key, (days.get(key) ?? 0) + tx.value);
    });

    return [...days.entries()].reduce<{ date: string; value: number } | null>(
        (best, [date, value]) => (!best || value > best.value ? { date, value } : best),
        null,
    );
};

const LARGE_PURCHASE_FACTOR = 5;

export type Forecast = {
    expense: number;
    income: number;
    net: number;
};

export const forecastPeriod = ({
    transactions,
    elapsed,
    total,
    outstandingPayments = 0,
    pendingIncome = 0,
}: {
    transactions: TransactionType[];
    elapsed: number;
    total: number;
    outstandingPayments?: number;
    pendingIncome?: number;
}): Forecast => {
    const expenses = transactions.filter(isExpense);
    const planned = (tx: TransactionType) => tx.categorie === SAVINGS_CATEGORY || isEssentialTransaction(tx);
    const largePurchase = median(expenses.filter((tx) => !planned(tx)).map((tx) => tx.value)) * LARGE_PURCHASE_FACTOR;
    const oneOff = expenses.filter((tx) => planned(tx) || tx.value > largePurchase);
    const flexible = sum(expenses) - sum(oneOff);
    const pace = elapsed > 0 ? flexible / elapsed : 0;
    const expense = sum(oneOff) + pace * total + outstandingPayments;
    const income = sum(transactions.filter(isIncome)) + pendingIncome;

    return { expense, income, net: income - expense };
};
