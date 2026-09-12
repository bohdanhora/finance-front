import dayjs from "dayjs";

import { EssentialType, ExpectedIncome, MonthSnapshot } from "../types/transactions";

type PlannedIncome = Pick<ExpectedIncome, "amount" | "received" | "receivedAmount">;
type PlannedEssential = Pick<EssentialType, "amount" | "checked" | "paidAmount">;

export type IncomePlanSummary = {
    planned: number;
    received: number;
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
    paid: number;
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

export const projectRemaining = (balance: number, incomes: PlannedIncome[], essentials: PlannedEssential[]) =>
    balance + summarizeExpectedIncomes(incomes).pending - summarizeEssentials(essentials).outstanding;

export type PaydayStatus = "upcoming" | "today" | "late";

export const paydayStatus = (day: number, today: Date = new Date()): PaydayStatus => {
    const payday = Math.min(day, dayjs(today).daysInMonth());
    const current = today.getDate();

    if (current === payday) return "today";
    return current > payday ? "late" : "upcoming";
};

export type MonthPlan = Pick<MonthSnapshot, "essentials" | "expectedIncomes">;

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
