import dayjs from "dayjs";

import { TransactionEnum } from "constants/index";
import { TransactionType } from "types/transactions";

export type MonthKey = string; // "YYYY-MM"

export const toMonthKey = (date: string | Date): MonthKey => dayjs(date).format("YYYY-MM");

/** Every month that has at least one transaction, newest first. */
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
    /** Mean spend per day that actually had spending. */
    averageExpense: number;
    largestExpense: TransactionType | null;
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
        largestExpense,
    };
};

export type CategorySlice = {
    name: string;
    value: number;
    percent: number;
};

/** Expense totals per category, largest first. */
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

export type DayPoint = {
    day: number;
    label: string;
    income: number;
    expense: number;
};

/** One entry per calendar day of the month, so gaps stay visible. */
export const byDay = (transactions: TransactionType[], month: MonthKey): DayPoint[] => {
    const start = dayjs(`${month}-01`);
    const daysInMonth = start.daysInMonth();

    const points: DayPoint[] = Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        label: String(index + 1),
        income: 0,
        expense: 0,
    }));

    transactions.forEach((tx) => {
        const index = dayjs(tx.date).date() - 1;
        if (index < 0 || index >= points.length) return;

        if (isExpense(tx)) {
            points[index].expense += tx.value;
        } else {
            points[index].income += tx.value;
        }
    });

    return points;
};

export type MonthPoint = {
    month: MonthKey;
    label: string;
    income: number;
    expense: number;
};

/** The last `count` months up to and including `upTo`, oldest first. */
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

/** Running balance change across the month, useful as a trend line. */
export const cumulativeNet = (points: DayPoint[]): number[] => {
    let running = 0;
    return points.map((point) => {
        running += point.income - point.expense;
        return running;
    });
};
