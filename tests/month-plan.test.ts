import assert from "node:assert/strict";
import test from "node:test";

import {
    paydayStatus,
    planForMonth,
    projectRemaining,
    summarizeEssentials,
    summarizeExpectedIncomes,
} from "../lib/month-plan";
import { MonthSnapshot } from "../types/transactions";

const salary = (amount: number, received = false, receivedAmount?: number) => ({ amount, received, receivedAmount });
const bill = (amount: number, checked = false, paidAmount?: number) => ({ amount, checked, paidAmount });

test("pending income counts only what has not arrived yet", () => {
    const summary = summarizeExpectedIncomes([salary(40000, true, 38500), salary(40000)]);

    assert.equal(summary.planned, 80000);
    assert.equal(summary.received, 38500);
    assert.equal(summary.pending, 40000);
    assert.equal(summary.receivedCount, 1);
    assert.equal(summary.total, 2);
});

test("a paid bill counts what was actually paid, an unpaid one what is still owed", () => {
    const summary = summarizeEssentials([bill(4000, true, 3200), bill(14000), bill(400, true)]);

    assert.equal(summary.planned, 18400);
    assert.equal(summary.paid, 3600);
    assert.equal(summary.outstanding, 14000);
    assert.equal(summary.paidCount, 2);
});

test("a salary still to come lifts the month out of zero", () => {
    const withoutSalary = projectRemaining(986.79, [], [bill(75900)]);
    const withSalary = projectRemaining(986.79, [salary(80000)], [bill(75900)]);

    assert.ok(withoutSalary < 0);
    assert.equal(withSalary.toFixed(2), "5086.79");
});

test("income already received is in the balance and is not counted twice", () => {
    assert.equal(projectRemaining(41000, [salary(40000, true, 40000)], []), 41000);
});

test("payday status follows the calendar and clamps to short months", () => {
    assert.equal(paydayStatus(15, new Date(2026, 8, 10)), "upcoming");
    assert.equal(paydayStatus(15, new Date(2026, 8, 15)), "today");
    assert.equal(paydayStatus(1, new Date(2026, 8, 10)), "late");
    assert.equal(paydayStatus(31, new Date(2026, 8, 30)), "today");
});

test("the current month uses live lists, a finished one its snapshot", () => {
    const history: MonthSnapshot[] = [
        {
            month: "2026-08",
            essentials: [{ id: "rent", title: "Rent", amount: 800, checked: true, paidAmount: 800 }],
            expectedIncomes: [],
        },
    ];
    const live = {
        essentials: [],
        expectedIncomes: [{ id: "s", title: "Salary", amount: 1, day: 15, received: false }],
    };

    assert.equal(planForMonth("2026-09", "2026-09", live, history), live);
    assert.equal(planForMonth("2026-08", "2026-09", live, history), history[0]);
    assert.equal(planForMonth("2026-07", "2026-09", live, history), null);
    assert.equal(planForMonth("2026-09", "2026-09", { essentials: [], expectedIncomes: [] }, history), null);
});
