import dayjs, { type Dayjs } from "dayjs";

import { TransactionType } from "../types/transactions";

export type PeriodKind = "week" | "month" | "quarter" | "year" | "custom";
export type CalendarKind = Exclude<PeriodKind, "custom">;

export type Period = {
    kind: PeriodKind;
    start: string;
    end: string;
};

export const DATE_FORMAT = "YYYY-MM-DD";

export const toDateKey = (date: string | Date | Dayjs) => dayjs(date).format(DATE_FORMAT);

const startOfCalendar = (kind: CalendarKind, date: Dayjs) => {
    if (kind === "week") return date.startOf("day").subtract((date.day() + 6) % 7, "day");
    if (kind === "quarter") return date.startOf("month").month(Math.floor(date.month() / 3) * 3);
    return date.startOf(kind);
};

const STEP: Record<CalendarKind, [number, "week" | "month" | "year"]> = {
    week: [1, "week"],
    month: [1, "month"],
    quarter: [3, "month"],
    year: [1, "year"],
};

export const periodOf = (kind: CalendarKind, date: string | Date | Dayjs = new Date()): Period => {
    const start = startOfCalendar(kind, dayjs(date));
    const [amount, unit] = STEP[kind];

    return { kind, start: toDateKey(start), end: toDateKey(start.add(amount, unit).subtract(1, "day")) };
};

export const customPeriod = (from: string, to: string): Period => {
    const [start, end] = [toDateKey(from), toDateKey(to)].sort();
    return { kind: "custom", start, end };
};

export const periodDays = (period: Period) => dayjs(period.end).diff(dayjs(period.start), "day") + 1;

export const shiftPeriod = (period: Period, delta: number): Period => {
    if (period.kind === "custom") {
        const length = periodDays(period) * delta;
        return {
            kind: "custom",
            start: toDateKey(dayjs(period.start).add(length, "day")),
            end: toDateKey(dayjs(period.end).add(length, "day")),
        };
    }

    const [amount, unit] = STEP[period.kind];
    return periodOf(period.kind, dayjs(period.start).add(amount * delta, unit));
};

export const containsDate = (period: Period, date: string | Date) => {
    const key = toDateKey(date);
    return key >= period.start && key <= period.end;
};

export const elapsedDays = (period: Period, today: Date = new Date()) => {
    const passed = dayjs(toDateKey(today)).diff(dayjs(period.start), "day") + 1;
    return Math.min(Math.max(passed, 0), periodDays(period));
};

export const isOngoing = (period: Period, today: Date = new Date()) =>
    containsDate(period, today) && toDateKey(today) < period.end;

export const periodMonthKey = (period: Period) => (period.kind === "month" ? period.start.slice(0, 7) : null);

export const filterByPeriod = (transactions: TransactionType[], period: Period) =>
    transactions.filter((tx) => containsDate(period, tx.date));

export type Granularity = "day" | "month";

export const granularityOf = (period: Period): Granularity => (periodDays(period) > 62 ? "month" : "day");

export type BucketPoint = {
    key: string;
    income: number;
    expense: number;
};

export const byBucket = (transactions: TransactionType[], period: Period): BucketPoint[] => {
    const granularity = granularityOf(period);
    const unit = granularity === "day" ? "day" : "month";
    const format = granularity === "day" ? DATE_FORMAT : "YYYY-MM";
    const points: BucketPoint[] = [];
    const index = new Map<string, BucketPoint>();

    for (
        let cursor = dayjs(period.start).startOf(unit);
        !cursor.isAfter(dayjs(period.end));
        cursor = cursor.add(1, unit)
    ) {
        const point = { key: cursor.format(format), income: 0, expense: 0 };
        points.push(point);
        index.set(point.key, point);
    }

    filterByPeriod(transactions, period).forEach((tx) => {
        const point = index.get(dayjs(tx.date).format(format));
        if (!point) return;
        if (tx.transactionType === "expense") point.expense += tx.value;
        else if (tx.transactionType === "income") point.income += tx.value;
    });

    return points;
};
