import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import { TransactionType } from "../types/transactions";
import { averageMonthlyExpense, pickHeadlineMode, projectMonthSpend, versusBaseline } from "../lib/statistics";

const expense = (date: string, value: number, id = "e" + date + value): TransactionType => ({
    id,
    transactionType: TransactionEnum.EXPENSE,
    description: "purchase",
    value,
    date,
    categorie: "groceries",
});

const income = (date: string, value: number, id = "i" + date): TransactionType => ({
    id,
    transactionType: TransactionEnum.INCOME,
    description: "salary",
    value,
    date,
    categorie: "income",
});

test("the projection extends the current pace over the whole month", () => {
    const pace = projectMonthSpend(9000, 9, 30);

    assert.equal(pace?.dailyAverage, 1000);
    assert.equal(pace?.projected, 30000);
    assert.equal(pace?.daysElapsed, 9);
});

test("a finished month projects to exactly what was spent", () => {
    const pace = projectMonthSpend(24000, 31, 31);

    assert.equal(pace?.projected, 24000);
});

test("elapsed days never exceed the month, so the projection cannot undershoot", () => {
    const pace = projectMonthSpend(3000, 45, 30);

    assert.equal(pace?.daysElapsed, 30);
    assert.equal(pace?.projected, 3000);
});

test("a month with no elapsed days has no projection at all", () => {
    assert.equal(projectMonthSpend(1000, 0, 30), null);
    assert.equal(projectMonthSpend(1000, 10, 0), null);
});

test("the baseline averages only the earlier months that had activity", () => {
    const transactions = [
        expense("2026-06-10", 3000),
        expense("2026-07-10", 5000),
        // August has income but no spending, so it counts as a 0 expense month.
        income("2026-08-05", 42000),
        expense("2026-09-02", 999),
    ];

    const baseline = averageMonthlyExpense(transactions, "2026-09");

    assert.equal(baseline.months, 3);
    assert.equal(baseline.average, (3000 + 5000 + 0) / 3);
});

test("the selected month is never part of its own baseline", () => {
    const baseline = averageMonthlyExpense([expense("2026-09-02", 8000), expense("2026-08-02", 2000)], "2026-09");

    assert.equal(baseline.months, 1);
    assert.equal(baseline.average, 2000);
});

test("months outside the window are ignored", () => {
    const transactions = [expense("2026-01-10", 100000), expense("2026-07-10", 4000), expense("2026-08-10", 2000)];

    const baseline = averageMonthlyExpense(transactions, "2026-09", 6);

    assert.equal(baseline.months, 2);
    assert.equal(baseline.average, 3000);
});

test("without earlier data there is nothing to compare against", () => {
    const baseline = averageMonthlyExpense([expense("2026-09-02", 8000)], "2026-09");

    assert.equal(baseline.months, 0);
    assert.equal(baseline.average, 0);
});

test("a pace measured over too few days is flagged as rough", () => {
    assert.equal(projectMonthSpend(30000, 2, 30)?.reliable, false);
    assert.equal(projectMonthSpend(30000, 5, 30)?.reliable, true);
    assert.equal(projectMonthSpend(30000, 31, 31)?.reliable, true);
});

test("a month in progress earns a forecast only once the pace means something", () => {
    const early = projectMonthSpend(30000, 2, 30);
    const settled = projectMonthSpend(30000, 12, 30);

    assert.equal(pickHeadlineMode(true, settled, 40), "forecast");
    assert.equal(pickHeadlineMode(true, early, 40), "lastMonthResult");
});

test("with nothing recorded last month the rough forecast is still better than a blank card", () => {
    assert.equal(pickHeadlineMode(true, projectMonthSpend(30000, 2, 30), 0), "forecast");
    assert.equal(pickHeadlineMode(true, null, 0), "forecast");
});

test("a month already in the past is only ever compared, never projected", () => {
    assert.equal(pickHeadlineMode(false, projectMonthSpend(30000, 31, 31), 40), "versusUsual");
    assert.equal(pickHeadlineMode(false, projectMonthSpend(30000, 2, 31), 0), "versusUsual");
});

test("the comparison is a signed percentage, and absent without a baseline", () => {
    assert.equal(versusBaseline(50913.92, { average: 45400, months: 6 })?.toFixed(1), "12.1");
    assert.equal(versusBaseline(20000, { average: 40000, months: 3 }), -50);
    assert.equal(versusBaseline(20000, { average: 0, months: 0 }), null);
});
