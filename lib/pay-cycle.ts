import dayjs, { Dayjs } from "dayjs";

import { TransactionEnum } from "../constants/index";
import { EssentialType, ExpectedIncome, TransactionType } from "../types/transactions";
import { isEssentialTransaction } from "./essential-category";
import { roundMoney } from "./money";

const SAVINGS_CATEGORY = "savings";
const PACE_TOLERANCE = 0.03;

type CycleIncome = Pick<ExpectedIncome, "id" | "amount" | "day" | "recurring" | "received">;
type CycleBill = Pick<EssentialType, "amount" | "checked">;
type CycleTransaction = Pick<TransactionType, "transactionType" | "value" | "date" | "categorie" | "essential">;

export type PayCycle = {
    start: Dayjs;
    end: Dayjs;
    daysLeft: number;
    daysTotal: number;
    daysElapsed: number;
    anchored: boolean;
    mainIncomeId: string | null;
};

const dayInMonth = (month: Dayjs, day: number) => month.date(Math.min(day, month.daysInMonth()));

export const findMainIncome = <T extends CycleIncome>(incomes: T[]): T | null =>
    incomes
        .filter((item) => item.recurring)
        .reduce<T | null>((main, item) => (!main || item.amount > main.amount ? item : main), null);

export const payCycleOf = (incomes: CycleIncome[], today: Date = new Date()): PayCycle => {
    const day = dayjs(today).startOf("day");
    const month = day.startOf("month");
    const main = findMainIncome(incomes);

    let start: Dayjs;
    let end: Dayjs;

    if (!main) {
        start = month;
        end = month.add(1, "month");
    } else {
        const payday = dayInMonth(month, main.day);
        const arrived = main.received || !day.isBefore(payday);

        start = arrived ? (payday.isAfter(day) ? day : payday) : dayInMonth(month.subtract(1, "month"), main.day);
        end = arrived ? dayInMonth(month.add(1, "month"), main.day) : payday;
    }

    return {
        start,
        end,
        daysLeft: Math.max(1, end.diff(day, "day")),
        daysTotal: Math.max(1, end.diff(start, "day")),
        daysElapsed: Math.max(1, day.diff(start, "day") + 1),
        anchored: Boolean(main),
        mainIncomeId: main?.id ?? null,
    };
};

export const incomingInCycle = (incomes: CycleIncome[], cycle: PayCycle, today: Date = new Date()) => {
    const day = dayjs(today).startOf("day");
    const month = day.startOf("month");
    const nextMonth = month.add(1, "month");

    const thisMonth = incomes
        .filter((item) => !item.received && dayInMonth(month, item.day).isBefore(cycle.end))
        .reduce((total, item) => total + item.amount, 0);

    const following = cycle.end.isAfter(nextMonth)
        ? incomes
              .filter((item) => item.recurring && dayInMonth(nextMonth, item.day).isBefore(cycle.end))
              .reduce((total, item) => total + item.amount, 0)
        : 0;

    return roundMoney(thisMonth + following);
};

const outstanding = (bills: CycleBill[]) => bills.reduce((total, item) => total + (item.checked ? 0 : item.amount), 0);

export const billsInCycle = (
    {
        current,
        next,
        template,
    }: {
        current: CycleBill[];
        next: CycleBill[];
        template: CycleBill[];
    },
    cycle: PayCycle,
    today: Date = new Date(),
) => {
    const nextMonth = dayjs(today).startOf("month").add(1, "month");
    const coversNextMonth = cycle.end.isAfter(nextMonth);
    const nextPlan = next.length ? next : template.map((item) => ({ ...item, checked: false }));

    return roundMoney(outstanding(current) + (coversNextMonth ? outstanding(nextPlan) : 0));
};

const isFlexibleSpend = (tx: CycleTransaction) =>
    tx.transactionType === TransactionEnum.EXPENSE && tx.categorie !== SAVINGS_CATEGORY && !isEssentialTransaction(tx);

export const flexibleSpending = (transactions: CycleTransaction[], from: Dayjs, today: Date = new Date()) => {
    const until = dayjs(today).endOf("day");

    return roundMoney(
        transactions
            .filter((tx) => isFlexibleSpend(tx) && !dayjs(tx.date).isBefore(from) && !dayjs(tx.date).isAfter(until))
            .reduce((total, tx) => total + tx.value, 0),
    );
};

export const savedInCycle = (transactions: CycleTransaction[], cycle: PayCycle, today: Date = new Date()) => {
    const until = dayjs(today).endOf("day");

    return roundMoney(
        transactions
            .filter(
                (tx) =>
                    tx.transactionType === TransactionEnum.EXPENSE &&
                    tx.categorie === SAVINGS_CATEGORY &&
                    !dayjs(tx.date).isBefore(cycle.start) &&
                    !dayjs(tx.date).isAfter(until),
            )
            .reduce((total, tx) => total + tx.value, 0),
    );
};

export type PaceStatus = "under" | "onTrack" | "over";

export type SafeToSpend = {
    cycle: PayCycle;
    balance: number;
    incoming: number;
    bills: number;
    savings: number;
    available: number;
    perDay: number;
    spentToday: number;
    leftToday: number;
    spentInCycle: number;
    plannedByNow: number;
    pace: PaceStatus;
    short: boolean;
};

export const safeToSpend = ({
    balance,
    incomes,
    bills,
    transactions,
    savingsPlan = 0,
    today = new Date(),
}: {
    balance: number;
    incomes: CycleIncome[];
    bills: { current: CycleBill[]; next: CycleBill[]; template: CycleBill[] };
    transactions: CycleTransaction[];
    savingsPlan?: number;
    today?: Date;
}): SafeToSpend => {
    const cycle = payCycleOf(incomes, today);
    const incoming = incomingInCycle(incomes, cycle, today);
    const billsLeft = billsInCycle(bills, cycle, today);
    const savings = roundMoney(Math.max(0, savingsPlan - savedInCycle(transactions, cycle, today)));
    const available = roundMoney(balance + incoming - billsLeft - savings);

    const spentToday = flexibleSpending(transactions, dayjs(today).startOf("day"), today);
    const spentInCycle = flexibleSpending(transactions, cycle.start, today);

    const todayLimit = Math.max(0, available + spentToday) / cycle.daysLeft;
    const budget = Math.max(0, available + spentInCycle);
    const plannedByNow = roundMoney((budget * Math.min(cycle.daysElapsed, cycle.daysTotal)) / cycle.daysTotal);
    const gap = spentInCycle - plannedByNow;
    const tolerance = budget * PACE_TOLERANCE;

    return {
        cycle,
        balance: roundMoney(balance),
        incoming,
        bills: billsLeft,
        savings,
        available,
        perDay: roundMoney(Math.max(0, available) / cycle.daysLeft),
        spentToday,
        leftToday: roundMoney(todayLimit - spentToday),
        spentInCycle,
        plannedByNow,
        pace: gap > tolerance ? "over" : gap < -tolerance ? "under" : "onTrack",
        short: available < 0,
    };
};
