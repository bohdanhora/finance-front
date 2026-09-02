import { CURRENCY } from "../../constants/index";
import { EssentialType, SavingsGoal, SavingsOperation, TransactionType } from "../../types/transactions";

export const REPORT_SECTIONS = ["summary", "categories", "dynamics", "essentials", "savings", "transactions"] as const;

export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const REPORT_PERIODS = ["currentMonth", "previousMonth", "last3Months", "last6Months", "year", "all"] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const TRANSACTION_FILTERS = ["all", "expense", "income"] as const;

export type TransactionsFilter = (typeof TRANSACTION_FILTERS)[number];

export type ReportOptions = {
    period: ReportPeriod;
    sections: ReportSection[];
    transactionsFilter: TransactionsFilter;
};

export type ReportInput = {
    options: ReportOptions;
    currency: CURRENCY;
    rates: { usdToUah: number; eurToUah: number };
    totalAmount: number;
    transactions: TransactionType[];
    essentials: EssentialType[];
    savingsGoals: SavingsGoal[];
    savingsOperations: SavingsOperation[];
    today?: Date;
};

export type ReportRange = {
    /** Inclusive start, or null for "everything up to `to`". */
    from: string | null;
    /** Inclusive end. */
    to: string;
};

export type ReportSummary = {
    balance: number;
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
    averageExpense: number;
    largestExpense: TransactionType | null;
    /** null when a rate is missing, exactly like the savings screen. */
    savingsTotal: number | null;
    essentialsRemaining: number;
};

export type ReportCategoryRow = {
    /** Category key, or "other" for the folded tail. */
    key: string;
    amount: number;
    percent: number;
    /** True for the row that folds everything past the top slots. */
    folded: boolean;
};

export type ReportMonthRow = {
    month: string;
    income: number;
    expense: number;
    net: number;
};

export type ReportEssentials = {
    items: EssentialType[];
    planned: number;
    paid: number;
    remaining: number;
};

export type ReportSavingsGoal = {
    id: string;
    name: string;
    currency: CURRENCY;
    targetAmount: number;
    covered: number;
    missing: number;
    progress: number;
    monthlyContribution: number;
    daysRemaining: number | null;
    targetDate?: string;
};

export type ReportSavingsSlice = {
    currency: CURRENCY;
    cash: number;
    card: number;
    total: number;
};

export type ReportSavings = {
    total: number | null;
    cash: number | null;
    card: number | null;
    slices: ReportSavingsSlice[];
    goals: ReportSavingsGoal[];
};

export type ReportModel = {
    range: ReportRange;
    currency: CURRENCY;
    generatedAt: string;
    summary: ReportSummary;
    categories: ReportCategoryRow[];
    dynamics: ReportMonthRow[];
    essentials: ReportEssentials;
    savings: ReportSavings;
    transactions: TransactionType[];
};
