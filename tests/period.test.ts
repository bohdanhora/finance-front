import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import { TransactionType } from "../types/transactions";
import {
    byBucket,
    customPeriod,
    cyclePeriod,
    elapsedDays,
    filterByPeriod,
    granularityOf,
    isOngoing,
    periodDays,
    periodOf,
    shiftPeriod,
} from "../lib/period";

const expense = (value: number, date: string): TransactionType => ({
    id: date + value,
    transactionType: TransactionEnum.EXPENSE,
    description: "",
    value,
    date,
    categorie: "groceries",
});

test("calendar periods start on monday, the first of the month or the quarter", () => {
    assert.deepEqual(periodOf("week", "2026-11-12"), { kind: "week", start: "2026-11-09", end: "2026-11-15" });
    assert.deepEqual(periodOf("week", "2026-11-15"), { kind: "week", start: "2026-11-09", end: "2026-11-15" });
    assert.deepEqual(periodOf("month", "2026-02-10"), { kind: "month", start: "2026-02-01", end: "2026-02-28" });
    assert.deepEqual(periodOf("quarter", "2026-11-10"), { kind: "quarter", start: "2026-10-01", end: "2026-12-31" });
    assert.deepEqual(periodOf("year", "2026-11-10"), { kind: "year", start: "2026-01-01", end: "2026-12-31" });
});

test("shifting moves by a whole period, custom ranges by their own length", () => {
    assert.deepEqual(shiftPeriod(periodOf("month", "2026-03-31"), -1), periodOf("month", "2026-02-01"));
    assert.deepEqual(shiftPeriod(periodOf("quarter", "2026-01-15"), -1), periodOf("quarter", "2025-11-01"));
    assert.deepEqual(shiftPeriod(customPeriod("2026-11-10", "2026-11-01"), -1), {
        kind: "custom",
        start: "2026-10-22",
        end: "2026-10-31",
    });
});

test("elapsed days stay inside the period", () => {
    const month = periodOf("month", "2026-11-01");

    assert.equal(periodDays(month), 30);
    assert.equal(elapsedDays(month, new Date(2026, 10, 10)), 10);
    assert.equal(elapsedDays(month, new Date(2026, 11, 3)), 30);
    assert.equal(elapsedDays(month, new Date(2026, 9, 3)), 0);
    assert.equal(isOngoing(month, new Date(2026, 10, 10)), true);
    assert.equal(isOngoing(month, new Date(2026, 10, 30)), false);
});

test("long periods are bucketed by month, short ones by day", () => {
    const items = [
        expense(100, "2026-11-02"),
        expense(50, "2026-11-02"),
        expense(70, "2026-12-01"),
        expense(5, "2027-01-01"),
    ];
    const month = periodOf("month", "2026-11-01");
    const quarter = periodOf("quarter", "2026-11-01");

    assert.equal(granularityOf(month), "day");
    assert.equal(granularityOf(quarter), "month");
    assert.equal(filterByPeriod(items, quarter).length, 3);
    assert.equal(byBucket(items, month).length, 30);
    assert.equal(byBucket(items, month)[1].expense, 150);
    assert.deepEqual(
        byBucket(items, quarter).map((point) => [point.key, point.expense]),
        [
            ["2026-10", 0],
            ["2026-11", 150],
            ["2026-12", 70],
        ],
    );
});

test("a pay cycle runs from one payday to the day before the next", () => {
    const period = cyclePeriod(30, new Date(2026, 10, 18));

    assert.deepEqual([period.start, period.end], ["2026-10-30", "2026-11-29"]);
    assert.deepEqual([shiftPeriod(period, 1).start, shiftPeriod(period, 1).end], ["2026-11-30", "2026-12-29"]);
    assert.deepEqual([shiftPeriod(period, -1).start, shiftPeriod(period, -1).end], ["2026-09-30", "2026-10-29"]);
    assert.deepEqual(
        [cyclePeriod(31, new Date(2027, 1, 28)).start, cyclePeriod(31, new Date(2027, 1, 28)).end],
        ["2027-02-28", "2027-03-30"],
    );
});
