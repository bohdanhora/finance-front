import dayjs, { Dayjs } from "dayjs";

import { TransactionEnum } from "../constants/index";
import { Card, EssentialType, TransactionType } from "../types/transactions";
import { isEssentialTransaction } from "./essential-category";
import { roundMoney } from "./money";

const SAVINGS_CATEGORY = "savings";
const MIN_COMPARABLE = 5;
const SUBSCRIPTIONS_CATEGORY = "subscriptions";
const LIVING_CATEGORIES = new Set(["groceries", "pharmacy"]);

type HealthTransaction = Pick<TransactionType, "transactionType" | "value" | "date" | "categorie" | "description"> &
    Partial<Pick<TransactionType, "id" | "cardId" | "toCardId" | "essential">>;
type HealthCard = Pick<Card, "id" | "balance" | "createdAt"> & Partial<Pick<Card, "creditLimit" | "personal">>;
type HealthBill = Pick<EssentialType, "title" | "amount"> & Partial<Pick<EssentialType, "category">>;

const sum = (values: number[]) => roundMoney(values.reduce((total, value) => total + value, 0));
const dayInMonth = (month: Dayjs, day: number) => month.date(Math.min(day, month.daysInMonth()));
const isExpense = (tx: HealthTransaction) => tx.transactionType === TransactionEnum.EXPENSE;
const isIncome = (tx: HealthTransaction) => tx.transactionType === TransactionEnum.INCOME;
const between = (tx: HealthTransaction, from: Dayjs, to: Dayjs) =>
    !dayjs(tx.date).isBefore(from) && dayjs(tx.date).isBefore(to);

export type Cushion = {
    bills: number;
    living: number;
    monthlyNeed: number;
    saved: number;
    months: number;
    target: { min: number; max: number };
    missingToMin: number;
};

export const cushionOf = ({
    template,
    current,
    transactions,
    saved,
    today = new Date(),
}: {
    template: HealthBill[];
    current: HealthBill[];
    transactions: HealthTransaction[];
    saved: number;
    today?: Date;
}): Cushion => {
    const bills = sum((template.length ? template : current).map((item) => item.amount));
    const monthStart = dayjs(today).startOf("month");
    const months = [1, 2, 3].map((offset) => monthStart.subtract(offset, "month"));
    const living = roundMoney(
        sum(
            months.map((month) =>
                sum(
                    transactions
                        .filter(
                            (tx) =>
                                isExpense(tx) &&
                                LIVING_CATEGORIES.has(tx.categorie) &&
                                between(tx, month, month.add(1, "month")),
                        )
                        .map((tx) => tx.value),
                ),
            ),
        ) /
            Math.max(
                1,
                months.filter((month) => transactions.some((tx) => between(tx, month, month.add(1, "month")))).length,
            ),
    );
    const monthlyNeed = roundMoney(bills + living);
    const target = { min: roundMoney(monthlyNeed * 3), max: roundMoney(monthlyNeed * 6) };

    return {
        bills,
        living,
        monthlyNeed,
        saved: roundMoney(saved),
        months: monthlyNeed > 0 ? Math.round((saved / monthlyNeed) * 10) / 10 : 0,
        target,
        missingToMin: roundMoney(Math.max(0, target.min - saved)),
    };
};

const effectOn = (tx: HealthTransaction, cardId: string, fallbackCard: string) => {
    const source = tx.cardId ?? fallbackCard;
    if (tx.transactionType === TransactionEnum.TRANSFER) {
        return (tx.toCardId === cardId ? tx.value : 0) - (source === cardId ? tx.value : 0);
    }
    if (source !== cardId) return 0;
    return isIncome(tx) ? tx.value : isExpense(tx) ? -tx.value : 0;
};

export const cardBalanceAt = (
    card: HealthCard,
    transactions: HealthTransaction[],
    moment: Dayjs,
    fallbackCard: string,
) =>
    roundMoney(
        transactions
            .filter((tx) => !dayjs(tx.date).isBefore(moment))
            .reduce((balance, tx) => balance - effectOn(tx, card.id, fallbackCard), card.balance),
    );

export type DebtPoint = { date: Dayjs; debt: number };
export type DebtTrend = {
    points: DebtPoint[];
    current: number;
    change: number;
    growingCycles: number;
    status: "none" | "growing" | "shrinking" | "flat";
};

export const creditDebtTrend = ({
    cards,
    transactions,
    payday,
    cycles = 5,
    today = new Date(),
}: {
    cards: HealthCard[];
    transactions: HealthTransaction[];
    payday?: number;
    cycles?: number;
    today?: Date;
}): DebtTrend => {
    const day = dayjs(today).startOf("day");
    const fallbackCard = cards[0]?.id ?? "";
    const credit = cards.filter((card) => !card.personal && ((card.creditLimit ?? 0) > 0 || card.balance < 0));
    const month = day.startOf("month");
    const anchor = payday ?? 1;
    const latestStart = dayInMonth(month, anchor).isAfter(day)
        ? dayInMonth(month.subtract(1, "month"), anchor)
        : dayInMonth(month, anchor);
    const starts = Array.from({ length: cycles }, (_, index) =>
        dayInMonth(latestStart.startOf("month").subtract(cycles - 1 - index, "month"), anchor),
    );

    const debtAt = (moment: Dayjs) =>
        sum(
            credit
                .filter((card) => !dayjs(card.createdAt).isAfter(moment.endOf("day")))
                .map((card) => Math.max(0, -cardBalanceAt(card, transactions, moment, fallbackCard))),
        );

    const points = [
        ...starts.map((date) => ({ date, debt: debtAt(date) })),
        { date: day, debt: debtAt(day.add(1, "day")) },
    ];
    const current = points[points.length - 1].debt;
    const previous = points[points.length - 2]?.debt ?? current;

    let growingCycles = 0;
    for (let index = points.length - 1; index > 0; index -= 1) {
        if (points[index].debt > points[index - 1].debt + 1) growingCycles += 1;
        else break;
    }

    const change = roundMoney(current - previous);
    const status =
        !credit.length || points.every((point) => point.debt === 0)
            ? "none"
            : change > 1
              ? "growing"
              : change < -1
                ? "shrinking"
                : "flat";

    return { points, current, change, growingCycles, status };
};

export type LimitProgress = {
    category: string;
    limit: number;
    spent: number;
    expected: number;
    share: number;
    status: "ok" | "ahead" | "over";
};

export const limitsInCycle = ({
    transactions,
    limits,
    start,
    daysElapsed,
    daysTotal,
    today = new Date(),
}: {
    transactions: HealthTransaction[];
    limits: Record<string, number>;
    start: Dayjs;
    daysElapsed: number;
    daysTotal: number;
    today?: Date;
}): LimitProgress[] => {
    const until = dayjs(today).endOf("day");
    const pace = Math.min(daysElapsed, daysTotal) / daysTotal;

    return Object.entries(limits)
        .filter(([, limit]) => limit > 0)
        .map(([category, limit]) => {
            const spent = sum(
                transactions
                    .filter(
                        (tx) =>
                            isExpense(tx) &&
                            tx.categorie === category &&
                            !dayjs(tx.date).isBefore(start) &&
                            !dayjs(tx.date).isAfter(until),
                    )
                    .map((tx) => tx.value),
            );
            const expected = roundMoney(limit * pace);
            const status: LimitProgress["status"] = spent > limit ? "over" : spent > expected * 1.1 ? "ahead" : "ok";
            return { category, limit, spent, expected, share: limit > 0 ? spent / limit : 0, status };
        })
        .sort((a, b) => b.share - a.share);
};

export type CategoryChange = { category: string; current: number; previous: number; change: number };

export type CycleReview = {
    income: number;
    spending: number;
    saved: number;
    kept: number;
    keptShare: number;
    previousSpending: number;
    spendingChange: number | null;
    flexible: number;
    grew: CategoryChange[];
    overLimits: { category: string; spent: number; limit: number }[];
};

const byCategory = (transactions: HealthTransaction[]) => {
    const totals = new Map<string, number>();
    transactions.forEach((tx) => totals.set(tx.categorie, (totals.get(tx.categorie) ?? 0) + tx.value));
    return totals;
};

export const cycleReview = ({
    transactions,
    period,
    previous,
    limits,
}: {
    transactions: HealthTransaction[];
    period: { start: Dayjs; end: Dayjs };
    previous: { start: Dayjs; end: Dayjs };
    limits: Record<string, number>;
}): CycleReview => {
    const inPeriod = transactions.filter((tx) => between(tx, period.start, period.end));
    const inPrevious = transactions.filter((tx) => between(tx, previous.start, previous.end));
    const spendingOf = (items: HealthTransaction[]) =>
        items.filter((tx) => isExpense(tx) && tx.categorie !== SAVINGS_CATEGORY);

    const income = sum(inPeriod.filter(isIncome).map((tx) => tx.value));
    const spending = sum(spendingOf(inPeriod).map((tx) => tx.value));
    const saved = sum(
        inPeriod.filter((tx) => isExpense(tx) && tx.categorie === SAVINGS_CATEGORY).map((tx) => tx.value),
    );
    const previousSpending = sum(spendingOf(inPrevious).map((tx) => tx.value));
    const flexible = sum(
        spendingOf(inPeriod)
            .filter((tx) => !isEssentialTransaction(tx))
            .map((tx) => tx.value),
    );

    const current = byCategory(spendingOf(inPeriod));
    const before = byCategory(spendingOf(inPrevious));
    const grew = [...current.entries()]
        .map(([category, value]) => ({
            category,
            current: roundMoney(value),
            previous: roundMoney(before.get(category) ?? 0),
            change: roundMoney(value - (before.get(category) ?? 0)),
        }))
        .filter((item) => item.change > 0 && item.previous > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 3);

    const overLimits = Object.entries(limits)
        .map(([category, limit]) => ({ category, limit, spent: roundMoney(current.get(category) ?? 0) }))
        .filter((item) => item.limit > 0 && item.spent > item.limit)
        .sort((a, b) => b.spent - b.limit - (a.spent - a.limit));

    const kept = roundMoney(income - spending);

    return {
        income,
        spending,
        saved,
        kept,
        keptShare: income > 0 ? kept / income : 0,
        previousSpending,
        spendingChange:
            previousSpending > 0 && spendingOf(inPrevious).length >= MIN_COMPARABLE
                ? (spending - previousSpending) / previousSpending
                : null,
        flexible,
        grew,
        overLimits,
    };
};

export type Subscription = { title: string; monthly: number; source: "plan" | "spending" };

const titleKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export const subscriptionsOf = ({
    template,
    current,
    transactions,
    today = new Date(),
}: {
    template: HealthBill[];
    current: HealthBill[];
    transactions: HealthTransaction[];
    today?: Date;
}) => {
    const planned = new Map<string, Subscription>();
    [...template, ...current]
        .filter((item) => item.category === SUBSCRIPTIONS_CATEGORY)
        .forEach((item) => {
            const key = titleKey(item.title);
            if (!planned.has(key)) planned.set(key, { title: item.title.trim(), monthly: item.amount, source: "plan" });
        });

    const since = dayjs(today).startOf("month").subtract(3, "month");
    const seen = new Map<string, { title: string; total: number; months: Set<string> }>();
    transactions
        .filter(
            (tx) =>
                isExpense(tx) &&
                tx.categorie === SUBSCRIPTIONS_CATEGORY &&
                !tx.essential &&
                !dayjs(tx.date).isBefore(since) &&
                tx.description.trim(),
        )
        .forEach((tx) => {
            const key = titleKey(tx.description);
            const entry = seen.get(key) ?? { title: tx.description.trim(), total: 0, months: new Set<string>() };
            entry.total += tx.value;
            entry.months.add(dayjs(tx.date).format("YYYY-MM"));
            seen.set(key, entry);
        });

    seen.forEach((entry, key) => {
        if (planned.has(key) || entry.months.size < 2) return;
        planned.set(key, {
            title: entry.title,
            monthly: roundMoney(entry.total / entry.months.size),
            source: "spending",
        });
    });

    const items = [...planned.values()].sort((a, b) => b.monthly - a.monthly);
    const monthly = sum(items.map((item) => item.monthly));

    return { items, monthly, yearly: roundMoney(monthly * 12) };
};
