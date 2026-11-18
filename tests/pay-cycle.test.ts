import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import {
    allocationFor,
    billsInCycle,
    incomingInCycle,
    payCycleOf,
    safeToSpend,
    scopeBudget,
    SHARED_SCOPE,
} from "../lib/pay-cycle";

const income = (id: string, amount: number, day: number, received = false, extra: { cardId?: string } = {}) => ({
    id,
    amount,
    day,
    received,
    recurring: true,
    ...extra,
});
const bill = (amount: number, checked = false, extra: { day?: number; fundedBy?: string; title?: string } = {}) => ({
    amount,
    checked,
    ...extra,
});
const spend = (
    value: number,
    date: string,
    extra: { categorie?: string; essential?: boolean; cardId?: string } = {},
) => ({
    transactionType: TransactionEnum.EXPENSE,
    value,
    date,
    categorie: extra.categorie ?? "food",
    essential: extra.essential,
    cardId: extra.cardId,
});
const noBills = { current: [], next: [], template: [] };

const mine = (received = false) => income("mine", 30000, 30, received);
const hers = (received = false) => income("hers", 1000, 1, received);

const shared = (parts: Partial<Parameters<typeof scopeBudget>[0]>, scope = SHARED_SCOPE) =>
    scopeBudget({ cards: [], incomes: [], bills: noBills, transactions: [], ...parts }, scope);

test("the cycle runs to the biggest salary, not to the end of the month", () => {
    const cycle = payCycleOf([mine(), hers(true)], new Date(2026, 10, 18));

    assert.equal(cycle.mainIncomeId, "mine");
    assert.equal(cycle.end.format("YYYY-MM-DD"), "2026-11-30");
    assert.equal(cycle.start.format("YYYY-MM-DD"), "2026-10-30");
    assert.equal(cycle.daysLeft, 12);
});

test("once the salary arrives the cycle jumps to the next payday", () => {
    const received = payCycleOf([mine(true), hers(true)], new Date(2026, 10, 30));
    const dueToday = payCycleOf([mine(), hers(true)], new Date(2026, 10, 30));

    assert.equal(received.end.format("YYYY-MM-DD"), "2026-12-30");
    assert.equal(dueToday.end.format("YYYY-MM-DD"), "2026-12-30");
    assert.equal(received.daysLeft, 30);
});

test("without a recurring income the cycle falls back to the calendar month", () => {
    const cycle = payCycleOf([], new Date(2026, 10, 18));

    assert.equal(cycle.anchored, false);
    assert.equal(cycle.daysLeft, 13);
});

test("a salary due today counts as money coming in, as does the smaller one before the next payday", () => {
    const today = new Date(2026, 10, 30);
    const incomes = [mine(), hers(true)];

    assert.equal(incomingInCycle(incomes, payCycleOf(incomes, today), today), 31000);
});

test("the next salary itself is not counted as available before it arrives", () => {
    const today = new Date(2026, 10, 18);
    const incomes = [mine(), hers(true)];

    assert.equal(incomingInCycle(incomes, payCycleOf(incomes, today), today), 0);
});

test("a cycle that crosses into next month reserves next month's bills due before payday", () => {
    const today = new Date(2026, 10, 30);
    const cycle = payCycleOf([mine(true)], today);
    const lists = {
        current: [bill(500, true)],
        next: [bill(15000, false, { day: 15 }), bill(2000), bill(700, false, { day: 31 })],
        template: [bill(99999)],
    };

    assert.equal(billsInCycle(lists, cycle, today), 17000);
});

test("an empty next month plan falls back to the template", () => {
    const today = new Date(2026, 10, 30);
    const cycle = payCycleOf([mine(true)], today);

    assert.equal(billsInCycle({ current: [], next: [], template: [bill(12000, true)] }, cycle, today), 12000);
});

test("a cycle ending on the 1st does not reserve next month's bills", () => {
    const today = new Date(2026, 10, 18);
    const cycle = payCycleOf([income("main", 30000, 1, true)], today);

    assert.equal(cycle.end.format("YYYY-MM-DD"), "2026-12-01");
    assert.equal(billsInCycle({ current: [bill(100)], next: [bill(15000)], template: [] }, cycle, today), 100);
});

test("credit card debt is not taken out of the money until payday", () => {
    const today = new Date(2026, 10, 18);
    const result = safeToSpend({
        scope: shared({
            cards: [
                { id: "own", balance: 9800 },
                { id: "credit", balance: -80000, creditLimit: 100000 },
            ],
            incomes: [mine(), hers(true)],
            bills: { current: [bill(3600)], next: [], template: [] },
        }),
        today,
    });

    assert.equal(result.own, 9800);
    assert.equal(result.debt, 80000);
    assert.equal(result.available, 6200);
    assert.equal(result.short, false);
});

test("safe to spend splits the rest until payday and tracks the pace", () => {
    const today = new Date(2026, 11, 2, 12);
    const result = safeToSpend({
        scope: shared({
            cards: [{ id: "a", balance: 26000 }],
            incomes: [mine(), hers(true)],
            bills: { current: [bill(15000), bill(1000, true)], next: [], template: [] },
            transactions: [
                spend(1000, "2026-12-02T10:00:00"),
                spend(1000, "2026-12-01T10:00:00", { categorie: "savings" }),
                spend(1000, "2026-12-01T09:00:00", { essential: true }),
                spend(2000, "2026-11-30T19:00:00"),
            ],
        }),
        today,
    });

    assert.equal(result.cycle.end.format("YYYY-MM-DD"), "2026-12-30");
    assert.equal(result.available, 11000);
    assert.equal(result.perDay, roundTwo(11000 / 28));
    assert.equal(result.spentToday, 1000);
    assert.equal(result.spentInCycle, 3000);
    assert.equal(result.leftToday, roundTwo(12000 / 28 - 1000));
    assert.equal(result.dailyPace, 1000);
    assert.equal(result.pace, "over");
});

test("the plan line lands on zero at payday and the pace line shows when money runs out", () => {
    const today = new Date(2026, 10, 20);
    const result = safeToSpend({
        scope: shared({
            cards: [{ id: "a", balance: 10000 }],
            incomes: [mine()],
            bills: { current: [bill(4000, false, { day: 25 })], next: [], template: [] },
            transactions: [spend(21000, "2026-11-05T10:00:00")],
        }),
        today,
    });

    const last = result.projection[result.projection.length - 1];
    assert.equal(result.projection.length, 10);
    assert.equal(Math.round(last.plan), 0);
    assert.equal(result.dailyPace, 1000);
    assert.equal(result.runsOutOn?.format("YYYY-MM-DD"), "2026-11-26");
    assert.equal(result.lowest?.date.format("YYYY-MM-DD"), "2026-11-29");
});

test("a personal card budgets only its own salary, bills and spending", () => {
    const cards = [
        { id: "mine", balance: 20000 },
        { id: "hers", balance: 5000, personal: true },
    ];
    const incomes = [
        income("my-salary", 30000, 30, false, { cardId: "mine" }),
        income("her-salary", 12000, 1, true, { cardId: "hers" }),
    ];
    const bills = {
        current: [
            bill(8000, false, { fundedBy: "my-salary" }),
            bill(1500, false, { fundedBy: "her-salary" }),
            bill(500),
        ],
        next: [],
        template: [],
    };
    const transactions = [
        spend(700, "2026-11-10T10:00:00", { cardId: "hers" }),
        spend(300, "2026-11-10T11:00:00", { cardId: "mine" }),
    ];
    const today = new Date(2026, 10, 18);

    const household = safeToSpend({ scope: shared({ cards, incomes, bills, transactions }), today });
    const herBudget = safeToSpend({ scope: shared({ cards, incomes, bills, transactions }, "hers"), today });

    assert.equal(household.own, 20000);
    assert.equal(household.available, 11500);
    assert.equal(household.spentInCycle, 300);
    assert.equal(herBudget.cycle.end.format("YYYY-MM-DD"), "2026-12-01");
    assert.equal(herBudget.available, 3500);
    assert.equal(herBudget.spentInCycle, 700);
});

test("a salary shows which bills it covers until it comes again", () => {
    const today = new Date(2026, 10, 30);
    const salary = income("mine", 99000, 30);
    const bills = {
        current: [bill(400, false, { fundedBy: "mine" }), bill(300, true, { fundedBy: "mine" })],
        next: [bill(25000, false, { day: 15, fundedBy: "mine" }), bill(1000, false, { fundedBy: "hers" })],
        template: [],
    };

    const allocation = allocationFor(salary, 99000, bills, today);

    assert.equal(allocation.billsTotal, 25400);
    assert.equal(allocation.free, 73600);
});

const roundTwo = (value: number) => Math.round(value * 100) / 100;
