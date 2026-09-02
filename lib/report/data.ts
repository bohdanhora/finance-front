import { CURRENCY, TransactionEnum } from "../../constants/index";
import { SavingsStorage, TransactionType } from "../../types/transactions";
import { calculateSavingsPace, getSavingsBalance, getSavingsNativeBalance } from "../savings";
import {
    ReportCategoryRow,
    ReportEssentials,
    ReportInput,
    ReportModel,
    ReportMonthRow,
    ReportPeriod,
    ReportRange,
    ReportSavings,
    ReportSummary,
    TransactionsFilter,
} from "./types";

/** Categories past this count are folded into a single "other" row. */
const MAX_CATEGORY_ROWS = 8;

const DYNAMICS_MONTHS = 6;

const pad = (value: number) => String(value).padStart(2, "0");

const toIsoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfMonth = (date: Date, offset = 0) => new Date(date.getFullYear(), date.getMonth() + offset, 1);

const endOfMonth = (date: Date, offset = 0) => new Date(date.getFullYear(), date.getMonth() + offset + 1, 0);

/** "YYYY-MM" for grouping, taken from the raw string so timezones cannot shift it. */
export const monthKey = (date: string) => date.slice(0, 7);

export const resolveRange = (period: ReportPeriod, today = new Date()): ReportRange => {
    const to = toIsoDay(period === "previousMonth" ? endOfMonth(today, -1) : today);

    switch (period) {
        case "currentMonth":
            return { from: toIsoDay(startOfMonth(today)), to };
        case "previousMonth":
            return { from: toIsoDay(startOfMonth(today, -1)), to };
        case "last3Months":
            return { from: toIsoDay(startOfMonth(today, -2)), to };
        case "last6Months":
            return { from: toIsoDay(startOfMonth(today, -5)), to };
        case "year":
            return { from: `${today.getFullYear()}-01-01`, to };
        default:
            return { from: null, to };
    }
};

const inRange = (transaction: TransactionType, range: ReportRange) => {
    const day = transaction.date.slice(0, 10);
    if (range.from && day < range.from) return false;
    return day <= range.to;
};

const isExpense = (transaction: TransactionType) => transaction.transactionType === TransactionEnum.EXPENSE;

const sumValues = (transactions: TransactionType[]) =>
    transactions.reduce((total, transaction) => total + transaction.value, 0);

const applyFilter = (transactions: TransactionType[], filter: TransactionsFilter) => {
    if (filter === "expense") return transactions.filter(isExpense);
    if (filter === "income") return transactions.filter((transaction) => !isExpense(transaction));
    return transactions;
};

export const buildCategoryRows = (transactions: TransactionType[]): ReportCategoryRow[] => {
    const totals = new Map<string, number>();

    transactions.filter(isExpense).forEach((transaction) => {
        totals.set(transaction.categorie, (totals.get(transaction.categorie) ?? 0) + transaction.value);
    });

    const grandTotal = [...totals.values()].reduce((total, value) => total + value, 0);
    if (!grandTotal) return [];

    const sorted = [...totals.entries()].sort((left, right) => right[1] - left[1]);
    const head = sorted.slice(0, MAX_CATEGORY_ROWS);
    const tail = sorted.slice(MAX_CATEGORY_ROWS);

    const rows: ReportCategoryRow[] = head.map(([key, amount]) => ({
        key,
        amount,
        percent: (amount / grandTotal) * 100,
        folded: false,
    }));

    if (tail.length) {
        const amount = tail.reduce((total, [, value]) => total + value, 0);
        rows.push({ key: "other", amount, percent: (amount / grandTotal) * 100, folded: true });
    }

    return rows;
};

/** The last `count` months ending on the range end, oldest first. */
export const buildDynamics = (
    transactions: TransactionType[],
    range: ReportRange,
    count = DYNAMICS_MONTHS,
): ReportMonthRow[] => {
    const [year, month] = range.to.split("-").map(Number);
    const end = new Date(year, month - 1, 1);

    return Array.from({ length: count }, (_, index) => {
        const cursor = startOfMonth(end, index - count + 1);
        const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;
        const inMonth = transactions.filter((transaction) => monthKey(transaction.date) === key);
        const income = sumValues(inMonth.filter((transaction) => !isExpense(transaction)));
        const expense = sumValues(inMonth.filter(isExpense));

        return { month: key, income, expense, net: income - expense };
    });
};

const buildEssentials = (input: ReportInput): ReportEssentials => {
    const items = input.essentials;
    const planned = items.reduce((total, item) => total + item.amount, 0);
    const paid = items
        .filter((item) => item.checked)
        .reduce((total, item) => total + (item.paidAmount ?? item.amount), 0);
    const remaining = items.filter((item) => !item.checked).reduce((total, item) => total + item.amount, 0);

    return { items, planned, paid, remaining };
};

const buildSavings = (input: ReportInput): ReportSavings => {
    const { savingsOperations, savingsGoals, currency, rates } = input;

    const slices = Object.values(CURRENCY)
        .map((code) => ({
            currency: code,
            cash: getSavingsNativeBalance(savingsOperations, code, SavingsStorage.CASH),
            card: getSavingsNativeBalance(savingsOperations, code, SavingsStorage.CARD),
            total: getSavingsNativeBalance(savingsOperations, code),
        }))
        .filter((slice) => slice.cash !== 0 || slice.card !== 0 || slice.total !== 0);

    const goals = savingsGoals.map((goal) => {
        const shared = getSavingsBalance(savingsOperations, goal.currency, rates);
        const saved = Math.max(shared ?? 0, 0);
        const covered = Math.min(saved, goal.targetAmount);
        const missing = Math.max(goal.targetAmount - saved, 0);
        const pace = calculateSavingsPace(missing, goal.targetDate, input.today);

        return {
            id: goal.id,
            name: goal.name,
            currency: goal.currency,
            targetAmount: goal.targetAmount,
            covered,
            missing,
            progress: goal.targetAmount > 0 ? Math.min((covered / goal.targetAmount) * 100, 100) : 0,
            monthlyContribution: pace && !pace.isOverdue ? pace.monthlyAmount : goal.monthlyContribution,
            daysRemaining: pace ? pace.daysRemaining : null,
            targetDate: goal.targetDate,
        };
    });

    return {
        total: getSavingsBalance(savingsOperations, currency, rates),
        cash: getSavingsBalance(savingsOperations, currency, rates, SavingsStorage.CASH),
        card: getSavingsBalance(savingsOperations, currency, rates, SavingsStorage.CARD),
        slices,
        goals,
    };
};

const buildSummary = (input: ReportInput, scoped: TransactionType[], savings: ReportSavings): ReportSummary => {
    const expenses = scoped.filter(isExpense);
    const incomes = scoped.filter((transaction) => !isExpense(transaction));
    const expense = sumValues(expenses);
    const income = sumValues(incomes);

    const largestExpense = expenses.reduce<TransactionType | null>(
        (largest, transaction) => (!largest || transaction.value > largest.value ? transaction : largest),
        null,
    );

    return {
        balance: input.totalAmount,
        income,
        expense,
        net: income - expense,
        transactionCount: scoped.length,
        averageExpense: expenses.length ? expense / expenses.length : 0,
        largestExpense,
        savingsTotal: savings.total,
        essentialsRemaining: input.essentials
            .filter((item) => !item.checked)
            .reduce((total, item) => total + item.amount, 0),
    };
};

export const buildReportModel = (input: ReportInput): ReportModel => {
    const today = input.today ?? new Date();
    const range = resolveRange(input.options.period, today);
    const scoped = input.transactions
        .filter((transaction) => inRange(transaction, range))
        .sort((left, right) => right.date.localeCompare(left.date));

    const savings = buildSavings({ ...input, today });

    return {
        range,
        currency: input.currency,
        generatedAt: toIsoDay(today),
        summary: buildSummary(input, scoped, savings),
        categories: buildCategoryRows(scoped),
        dynamics: buildDynamics(input.transactions, range),
        essentials: buildEssentials(input),
        savings,
        transactions: applyFilter(scoped, input.options.transactionsFilter),
    };
};
