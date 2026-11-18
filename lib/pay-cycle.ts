import dayjs, { Dayjs } from "dayjs";

import { TransactionEnum } from "../constants/index";
import { Card, EssentialType, ExpectedIncome, TransactionType } from "../types/transactions";
import { isEssentialTransaction } from "./essential-category";
import { roundMoney } from "./money";

const SAVINGS_CATEGORY = "savings";
const PACE_TOLERANCE = 0.05;
const PACE_WINDOW_DAYS = 14;
const BIG_PURCHASE_MIN_COUNT = 5;
const BIG_PURCHASE_MEDIAN_FACTOR = 3;
const BIG_PURCHASE_DAILY_FACTOR = 2;

export type CycleIncome = Pick<ExpectedIncome, "id" | "amount" | "day" | "recurring" | "received"> &
    Partial<Pick<ExpectedIncome, "cardId" | "title">>;
export type CycleBill = Pick<EssentialType, "amount" | "checked"> &
    Partial<Pick<EssentialType, "id" | "title" | "day" | "fundedBy">>;
export type CycleTransaction = Pick<TransactionType, "transactionType" | "value" | "date" | "categorie" | "essential"> &
    Partial<Pick<TransactionType, "cardId">>;
export type CycleCard = Pick<Card, "id" | "balance"> & Partial<Pick<Card, "personal" | "creditLimit">>;
export type CycleBills = { current: CycleBill[]; next: CycleBill[]; template: CycleBill[] };

export type PayCycle = {
    start: Dayjs;
    end: Dayjs;
    daysLeft: number;
    daysTotal: number;
    daysElapsed: number;
    anchored: boolean;
    mainIncomeId: string | null;
};

export const SHARED_SCOPE = "shared";

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

type Dated<T> = { item: T; date: Dayjs };

export const incomingEvents = <T extends CycleIncome>(incomes: T[], end: Dayjs, today: Date = new Date()) => {
    const day = dayjs(today).startOf("day");
    const month = day.startOf("month");
    const nextMonth = month.add(1, "month");

    const thisMonth = incomes
        .filter((item) => !item.received && dayInMonth(month, item.day).isBefore(end))
        .map((item) => {
            const date = dayInMonth(month, item.day);
            return { item, date: date.isBefore(day) ? day : date };
        });

    const following = end.isAfter(nextMonth)
        ? incomes
              .filter((item) => item.recurring && dayInMonth(nextMonth, item.day).isBefore(end))
              .map((item) => ({ item, date: dayInMonth(nextMonth, item.day) }))
        : [];

    return [...thisMonth, ...following] as Dated<T>[];
};

export const incomingInCycle = (incomes: CycleIncome[], cycle: PayCycle, today: Date = new Date()) =>
    roundMoney(incomingEvents(incomes, cycle.end, today).reduce((total, event) => total + event.item.amount, 0));

const unpaid = (bills: CycleBill[]) => bills.filter((item) => !item.checked);

export const billEvents = (bills: CycleBills, end: Dayjs, today: Date = new Date()) => {
    const day = dayjs(today).startOf("day");
    const month = day.startOf("month");
    const nextMonth = month.add(1, "month");
    const nextPlan = bills.next.length ? bills.next : bills.template.map((item) => ({ ...item, checked: false }));

    const thisMonth = unpaid(bills.current).map((item) => {
        const date = item.day ? dayInMonth(month, item.day) : day;
        return { item, date: date.isBefore(day) ? day : date };
    });

    const following = end.isAfter(nextMonth)
        ? unpaid(nextPlan)
              .map((item) => ({ item, date: item.day ? dayInMonth(nextMonth, item.day) : nextMonth }))
              .filter((event) => event.date.isBefore(end))
        : [];

    return [...thisMonth, ...following] as Dated<CycleBill>[];
};

export const billsInCycle = (bills: CycleBills, cycle: PayCycle, today: Date = new Date()) =>
    roundMoney(billEvents(bills, cycle.end, today).reduce((total, event) => total + event.item.amount, 0));

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

export type BudgetScope = {
    cards: CycleCard[];
    incomes: CycleIncome[];
    bills: CycleBills;
    transactions: CycleTransaction[];
};

export const scopeBudget = (
    {
        cards,
        incomes,
        bills,
        transactions,
    }: {
        cards: CycleCard[];
        incomes: CycleIncome[];
        bills: CycleBills;
        transactions: CycleTransaction[];
    },
    scope: string = SHARED_SCOPE,
): BudgetScope => {
    const personal = new Set(cards.filter((card) => card.personal).map((card) => card.id));
    const fallbackCard = cards[0]?.id;
    const inScope =
        scope === SHARED_SCOPE
            ? (cardId?: string) => !personal.has(cardId ?? fallbackCard ?? "")
            : (cardId?: string) => (cardId ?? fallbackCard) === scope;
    const incomeInScope = (income: CycleIncome) =>
        scope === SHARED_SCOPE ? !income.cardId || !personal.has(income.cardId) : income.cardId === scope;

    const scopedIncomes = incomes.filter(incomeInScope);
    const allIds = new Set(incomes.map((income) => income.id));
    const scopedIds = new Set(scopedIncomes.map((income) => income.id));
    const billInScope = (bill: CycleBill) =>
        bill.fundedBy && allIds.has(bill.fundedBy) ? scopedIds.has(bill.fundedBy) : scope === SHARED_SCOPE;
    const pick = (items: CycleBill[]) => items.filter(billInScope);

    return {
        cards: cards.filter((card) => (scope === SHARED_SCOPE ? !card.personal : card.id === scope)),
        incomes: scopedIncomes,
        bills: { current: pick(bills.current), next: pick(bills.next), template: pick(bills.template) },
        transactions: transactions.filter((tx) => inScope(tx.cardId)),
    };
};

export type TypicalPace = {
    perDay: number;
    days: number;
    bigCount: number;
    bigTotal: number;
};

const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const typicalPace = (transactions: CycleTransaction[], today: Date = new Date()): TypicalPace => {
    const day = dayjs(today).startOf("day");
    const earliest = transactions.reduce<Dayjs | null>((min, tx) => {
        const date = dayjs(tx.date).startOf("day");
        return !min || date.isBefore(min) ? date : min;
    }, null);
    const windowStart = day.subtract(PACE_WINDOW_DAYS, "day");
    const from = earliest && earliest.isAfter(windowStart) ? earliest : windowStart;
    const days = Math.max(0, day.diff(from, "day"));

    if (days === 0) {
        return { perDay: flexibleSpending(transactions, day, today), days: 0, bigCount: 0, bigTotal: 0 };
    }

    const purchases = transactions
        .filter((tx) => isFlexibleSpend(tx) && !dayjs(tx.date).isBefore(from) && dayjs(tx.date).isBefore(day))
        .map((tx) => tx.value);
    const total = purchases.reduce((sum, value) => sum + value, 0);
    const threshold =
        purchases.length >= BIG_PURCHASE_MIN_COUNT
            ? Math.max(median(purchases) * BIG_PURCHASE_MEDIAN_FACTOR, (total / days) * BIG_PURCHASE_DAILY_FACTOR)
            : Infinity;
    const big = purchases.filter((value) => value > threshold);
    const bigTotal = big.reduce((sum, value) => sum + value, 0);

    return {
        perDay: roundMoney((total - bigTotal) / days),
        days,
        bigCount: big.length,
        bigTotal: roundMoney(bigTotal),
    };
};

export type AfterPayday = {
    salary: number;
    debt: number;
    left: number;
    atPace: number;
};

export type PaceStatus = "under" | "onTrack" | "over";

export type ProjectionPoint = { date: Dayjs; plan: number; pace: number };

export type SafeToSpend = {
    cycle: PayCycle;
    own: number;
    debt: number;
    incoming: number;
    bills: number;
    available: number;
    perDay: number;
    spentToday: number;
    leftToday: number;
    spentInCycle: number;
    dailyPace: number;
    typical: TypicalPace;
    afterPayday: AfterPayday | null;
    dailyLimit: number;
    pace: PaceStatus;
    short: boolean;
    projection: ProjectionPoint[];
    runsOutOn: Dayjs | null;
    lowest: ProjectionPoint | null;
};

const ownMoney = (cards: CycleCard[]) =>
    roundMoney(cards.reduce((total, card) => total + Math.max(0, card.balance), 0));
const creditDebt = (cards: CycleCard[]) =>
    roundMoney(cards.reduce((total, card) => total + Math.max(0, -card.balance), 0));

export const projectCycle = ({
    start,
    cycle,
    incomes,
    bills,
    perDay,
    dailyPace,
    today = new Date(),
}: {
    start: number;
    cycle: PayCycle;
    incomes: CycleIncome[];
    bills: CycleBills;
    perDay: number;
    dailyPace: number;
    today?: Date;
}): ProjectionPoint[] => {
    const day = dayjs(today).startOf("day");
    const moves = new Map<string, number>();
    const add = (date: Dayjs, amount: number) => {
        const key = date.format("YYYY-MM-DD");
        moves.set(key, (moves.get(key) ?? 0) + amount);
    };

    incomingEvents(incomes, cycle.end, today).forEach((event) => add(event.date, event.item.amount));
    billEvents(bills, cycle.end, today).forEach((event) => add(event.date, -event.item.amount));

    const points: ProjectionPoint[] = [];
    let plan = start;
    let pace = start;

    for (let date = day; date.isBefore(cycle.end); date = date.add(1, "day")) {
        const move = moves.get(date.format("YYYY-MM-DD")) ?? 0;
        plan += move - perDay;
        pace += move - dailyPace;
        points.push({ date, plan: roundMoney(plan), pace: roundMoney(pace) });
    }

    return points;
};

export const safeToSpend = ({ scope, today = new Date() }: { scope: BudgetScope; today?: Date }): SafeToSpend => {
    const { cards, incomes, bills, transactions } = scope;
    const cycle = payCycleOf(incomes, today);
    const own = ownMoney(cards);
    const incoming = incomingInCycle(incomes, cycle, today);
    const billsLeft = billsInCycle(bills, cycle, today);
    const available = roundMoney(own + incoming - billsLeft);

    const dayStart = dayjs(today).startOf("day");
    const creditIds = new Set(
        cards.filter((card) => (card.creditLimit ?? 0) > 0 || card.balance < 0).map((card) => card.id),
    );
    const fallbackCard = cards[0]?.id ?? "";
    const spentToday = flexibleSpending(transactions, dayStart, today);
    const spentTodayOwn = flexibleSpending(
        transactions.filter((tx) => !creditIds.has(tx.cardId ?? fallbackCard)),
        dayStart,
        today,
    );
    const spentInCycle = flexibleSpending(transactions, cycle.start, today);

    const todayLimit = Math.max(0, available + spentTodayOwn) / cycle.daysLeft;
    const perDay = roundMoney(Math.max(0, available) / cycle.daysLeft);
    const typical = typicalPace(transactions, today);
    const dailyPace = typical.perDay;

    const main = cycle.anchored ? incomes.find((income) => income.id === cycle.mainIncomeId) : undefined;
    const debt = creditDebt(cards);
    const afterPayday = main
        ? (() => {
              const left = roundMoney(available + main.amount - debt);
              const stillToSpend = Math.max(0, dailyPace - spentToday) + dailyPace * (cycle.daysLeft - 1);
              return { salary: main.amount, debt, left, atPace: roundMoney(left - stillToSpend) };
          })()
        : null;

    const projection = projectCycle({
        start: roundMoney(own + spentTodayOwn),
        cycle,
        incomes,
        bills,
        perDay: todayLimit,
        dailyPace,
        today,
    });
    const runsOut = projection.find((point) => point.pace < 0) ?? null;
    const lowest = projection.reduce<ProjectionPoint | null>(
        (min, point) => (!min || point.plan < min.plan ? point : min),
        null,
    );

    return {
        cycle,
        own,
        debt,
        incoming,
        bills: billsLeft,
        available,
        perDay,
        spentToday,
        leftToday: roundMoney(todayLimit - spentToday),
        spentInCycle,
        dailyPace,
        typical,
        afterPayday,
        dailyLimit: roundMoney(todayLimit),
        pace:
            dailyPace > todayLimit * (1 + PACE_TOLERANCE)
                ? "over"
                : dailyPace < todayLimit * (1 - PACE_TOLERANCE)
                  ? "under"
                  : "onTrack",
        short: available < 0,
        projection,
        runsOutOn: runsOut?.date ?? null,
        lowest,
    };
};

export type IncomeAllocation = {
    bills: CycleBill[];
    billsTotal: number;
    free: number;
};

export const allocationFor = (
    income: CycleIncome,
    amount: number,
    bills: CycleBills,
    today: Date = new Date(),
): IncomeAllocation => {
    const month = dayjs(today).startOf("month");
    const nextPayday = dayInMonth(month.add(1, "month"), income.day);
    const funded = billEvents(bills, nextPayday, today)
        .map((event) => event.item)
        .filter((bill) => bill.fundedBy === income.id);
    const billsTotal = roundMoney(funded.reduce((total, bill) => total + bill.amount, 0));

    return { bills: funded, billsTotal, free: roundMoney(amount - billsTotal) };
};
