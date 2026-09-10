import dayjs from "dayjs";

import { EssentialType, ExpectedIncome, MonthSnapshot } from "../types/transactions";

type PlannedIncome = Pick<ExpectedIncome, "amount" | "received" | "receivedAmount">;
type PlannedEssential = Pick<EssentialType, "amount" | "checked" | "paidAmount">;

export type IncomePlanSummary = {
    planned: number;
    /** What actually arrived for the items already marked as received. */
    received: number;
    /** Planned amounts of the items still on their way. */
    pending: number;
    receivedCount: number;
    total: number;
};

export const summarizeExpectedIncomes = (items: PlannedIncome[]): IncomePlanSummary =>
    items.reduce<IncomePlanSummary>(
        (summary, item) => ({
            planned: summary.planned + item.amount,
            received: summary.received + (item.received ? (item.receivedAmount ?? item.amount) : 0),
            pending: summary.pending + (item.received ? 0 : item.amount),
            receivedCount: summary.receivedCount + (item.received ? 1 : 0),
            total: summary.total + 1,
        }),
        { planned: 0, received: 0, pending: 0, receivedCount: 0, total: 0 },
    );

export type EssentialsPlanSummary = {
    planned: number;
    /** What was actually paid for the bills already ticked off. */
    paid: number;
    /** Planned amounts of the bills still owed. */
    outstanding: number;
    paidCount: number;
    total: number;
};

export const summarizeEssentials = (items: PlannedEssential[]): EssentialsPlanSummary =>
    items.reduce<EssentialsPlanSummary>(
        (summary, item) => ({
            planned: summary.planned + item.amount,
            paid: summary.paid + (item.checked ? (item.paidAmount ?? item.amount) : 0),
            outstanding: summary.outstanding + (item.checked ? 0 : item.amount),
            paidCount: summary.paidCount + (item.checked ? 1 : 0),
            total: summary.total + 1,
        }),
        { planned: 0, paid: 0, outstanding: 0, paidCount: 0, total: 0 },
    );

/**
 * What the month really leaves to spend: the balance plus income that is
 * still on its way, minus the bills that are still owed. Without the pending
 * income a salary on the 15th made the first half of every month read zero.
 */
export const projectRemaining = (balance: number, incomes: PlannedIncome[], essentials: PlannedEssential[]) =>
    balance + summarizeExpectedIncomes(incomes).pending - summarizeEssentials(essentials).outstanding;

export type PaydayStatus = "upcoming" | "today" | "late";

/** A payday of 31 falls on the last day of a shorter month. */
export const paydayStatus = (day: number, today: Date = new Date()): PaydayStatus => {
    const payday = Math.min(day, dayjs(today).daysInMonth());
    const current = today.getDate();

    if (current === payday) return "today";
    return current > payday ? "late" : "upcoming";
};

export type MonthPlan = Pick<MonthSnapshot, "essentials" | "expectedIncomes">;

/**
 * The plan behind a month: the live lists for the month in progress, the
 * recorded snapshot for a finished one, or nothing when neither exists.
 */
export const planForMonth = (
    month: string,
    currentMonth: string,
    live: MonthPlan,
    history: MonthSnapshot[],
): MonthPlan | null => {
    const plan = month === currentMonth ? live : history.find((entry) => entry.month === month);

    if (!plan || (!plan.essentials.length && !plan.expectedIncomes.length)) return null;
    return plan;
};
