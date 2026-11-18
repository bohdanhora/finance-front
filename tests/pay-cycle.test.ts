import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import { billsInCycle, incomingInCycle, payCycleOf, safeToSpend } from "../lib/pay-cycle";

const income = (id: string, amount: number, day: number, received = false, recurring = true) => ({
    id,
    amount,
    day,
    received,
    recurring,
});
const bill = (amount: number, checked = false) => ({ amount, checked });
const spend = (value: number, date: string, extra: { categorie?: string; essential?: boolean } = {}) => ({
    transactionType: TransactionEnum.EXPENSE,
    value,
    date,
    categorie: extra.categorie ?? "food",
    essential: extra.essential,
});

const mine = (received = false) => income("mine", 30000, 30, received);
const hers = (received = false) => income("hers", 1000, 1, received);

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
    const cycle = payCycleOf(incomes, today);

    assert.equal(incomingInCycle(incomes, cycle, today), 31000);
});

test("the next salary itself is not counted as available before it arrives", () => {
    const today = new Date(2026, 10, 18);
    const incomes = [mine(), hers(true)];

    assert.equal(incomingInCycle(incomes, payCycleOf(incomes, today), today), 0);
});

test("a cycle that crosses into next month reserves next month's bills", () => {
    const today = new Date(2026, 10, 30);
    const cycle = payCycleOf([mine(true)], today);
    const lists = { current: [bill(500, true)], next: [bill(15000), bill(2000)], template: [bill(99999)] };

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

test("safe to spend hides bills and savings and splits the rest until payday", () => {
    const today = new Date(2026, 11, 2, 12);
    const result = safeToSpend({
        balance: 26000,
        incomes: [mine(), hers(true)],
        bills: { current: [bill(15000), bill(1000, true)], next: [], template: [] },
        transactions: [
            spend(1000, "2026-12-02T10:00:00"),
            spend(1000, "2026-12-01T10:00:00", { categorie: "savings" }),
            spend(1000, "2026-12-01T09:00:00", { essential: true }),
            spend(2000, "2026-11-30T19:00:00"),
        ],
        savingsPlan: 3000,
        today,
    });

    assert.equal(result.cycle.end.format("YYYY-MM-DD"), "2026-12-30");
    assert.equal(result.bills, 15000);
    assert.equal(result.savings, 2000);
    assert.equal(result.available, 9000);
    assert.equal(result.perDay, roundTwo(9000 / 28));
    assert.equal(result.spentToday, 1000);
    assert.equal(result.spentInCycle, 3000);
    assert.equal(result.leftToday, roundTwo(10000 / 28 - 1000));
    assert.equal(result.pace, "over");
    assert.equal(result.short, false);
});

test("spending slower than the plan reads as under, a shortfall is flagged", () => {
    const today = new Date(2026, 11, 20);
    const calm = safeToSpend({
        balance: 20000,
        incomes: [income("mine", 30000, 30)],
        bills: { current: [], next: [], template: [] },
        transactions: [],
        today,
    });
    const short = safeToSpend({
        balance: 1000,
        incomes: [income("mine", 30000, 30)],
        bills: { current: [bill(5000)], next: [], template: [] },
        transactions: [],
        today,
    });

    assert.equal(calm.pace, "under");
    assert.equal(short.short, true);
    assert.equal(short.perDay, 0);
});

const roundTwo = (value: number) => Math.round(value * 100) / 100;
