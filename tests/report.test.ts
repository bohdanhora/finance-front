import assert from "node:assert/strict";
import test from "node:test";

import { CURRENCY, TransactionEnum } from "../constants/index";
import { SavingsOperationType, SavingsStorage, TransactionType } from "../types/transactions";
import { buildCategoryRows, buildDynamics, buildReportModel, resolveRange } from "../lib/report/data";
import { ReportInput } from "../lib/report/types";

const expense = (date: string, value: number, categorie: string, id = date + categorie): TransactionType => ({
    id,
    transactionType: TransactionEnum.EXPENSE,
    description: categorie,
    value,
    date,
    categorie,
});

const income = (date: string, value: number, id = "in" + date): TransactionType => ({
    id,
    transactionType: TransactionEnum.INCOME,
    description: "salary",
    value,
    date,
    categorie: "income",
});

const baseInput = (transactions: TransactionType[], overrides: Partial<ReportInput> = {}): ReportInput => ({
    options: { period: "currentMonth", sections: ["summary"], transactionsFilter: "all" },
    currency: CURRENCY.UAH,
    rates: { usdToUah: 41, eurToUah: 48 },
    totalAmount: 10000,
    transactions,
    essentials: [],
    savingsGoals: [],
    savingsOperations: [],
    today: new Date(2026, 8, 15),
    ...overrides,
});

test("resolveRange covers whole months and leaves the tail open for all time", () => {
    const today = new Date(2026, 8, 15);

    assert.deepEqual(resolveRange("currentMonth", today), { from: "2026-09-01", to: "2026-09-15" });
    assert.deepEqual(resolveRange("previousMonth", today), { from: "2026-08-01", to: "2026-08-31" });
    assert.deepEqual(resolveRange("last3Months", today), { from: "2026-07-01", to: "2026-09-15" });
    assert.deepEqual(resolveRange("year", today), { from: "2026-01-01", to: "2026-09-15" });
    assert.equal(resolveRange("all", today).from, null);
});

test("only transactions inside the period reach the summary", () => {
    const model = buildReportModel(
        baseInput([
            expense("2026-09-02", 300, "groceries"),
            income("2026-09-03", 1000),
            expense("2026-08-30", 999, "groceries"),
        ]),
    );

    assert.equal(model.summary.expense, 300);
    assert.equal(model.summary.income, 1000);
    assert.equal(model.summary.net, 700);
    assert.equal(model.summary.transactionCount, 2);
    assert.equal(model.summary.balance, 10000);
});

test("a period that ends before today keeps its own last day", () => {
    const model = buildReportModel(
        baseInput([expense("2026-08-31", 100, "groceries"), expense("2026-09-01", 100, "groceries")], {
            options: { period: "previousMonth", sections: ["summary"], transactionsFilter: "all" },
        }),
    );

    assert.equal(model.summary.expense, 100);
    assert.equal(model.range.to, "2026-08-31");
});

test("categories are ranked and everything past the eighth folds into one row", () => {
    const transactions = Array.from({ length: 10 }, (_, index) =>
        expense("2026-09-0" + ((index % 9) + 1), 100 - index, "cat" + index),
    );

    const rows = buildCategoryRows(transactions);

    assert.equal(rows.length, 9);
    assert.equal(rows[0].key, "cat0");
    assert.equal(rows[8].folded, true);
    assert.equal(rows[8].amount, 92 + 91);
    assert.equal(Math.round(rows.reduce((total, row) => total + row.percent, 0)), 100);
});

test("expenses of the same category are summed, income never counts as a category", () => {
    const rows = buildCategoryRows([
        expense("2026-09-01", 100, "groceries", "a"),
        expense("2026-09-02", 50, "groceries", "b"),
        income("2026-09-03", 5000),
    ]);

    assert.equal(rows.length, 1);
    assert.equal(rows[0].amount, 150);
    assert.equal(rows[0].percent, 100);
});

test("dynamics always returns six months ending on the range, empty ones included", () => {
    const rows = buildDynamics([expense("2026-07-10", 200, "groceries"), income("2026-09-01", 400)], {
        from: "2026-09-01",
        to: "2026-09-15",
    });

    assert.equal(rows.length, 6);
    assert.equal(rows[0].month, "2026-04");
    assert.equal(rows[5].month, "2026-09");
    assert.equal(rows[3].expense, 200);
    assert.equal(rows[5].income, 400);
    assert.equal(rows[5].net, 400);
    assert.equal(rows[1].income + rows[1].expense, 0);
});

test("the transactions filter narrows the list but never the totals", () => {
    const model = buildReportModel(
        baseInput([expense("2026-09-02", 300, "groceries"), income("2026-09-03", 1000)], {
            options: { period: "currentMonth", sections: ["transactions"], transactionsFilter: "expense" },
        }),
    );

    assert.equal(model.transactions.length, 1);
    assert.equal(model.transactions[0].transactionType, TransactionEnum.EXPENSE);
    assert.equal(model.summary.income, 1000);
});

test("essentials split into planned, actually paid and what is still due", () => {
    const model = buildReportModel(
        baseInput([], {
            essentials: [
                { id: "1", title: "utilities", amount: 4000, checked: true, paidAmount: 3200 },
                { id: "2", title: "internet", amount: 500, checked: true },
                { id: "3", title: "rent", amount: 12000, checked: false },
            ],
        }),
    );

    assert.equal(model.essentials.planned, 16500);
    assert.equal(model.essentials.paid, 3700);
    assert.equal(model.essentials.remaining, 12000);
    assert.equal(model.summary.essentialsRemaining, 12000);
});

test("savings are reported per storage and converted into the base currency", () => {
    const model = buildReportModel(
        baseInput([], {
            savingsOperations: [
                {
                    id: "1",
                    type: SavingsOperationType.DEPOSIT,
                    storage: SavingsStorage.CARD,
                    amount: 2300,
                    currency: CURRENCY.UAH,
                    date: "2026-09-01",
                },
                {
                    id: "2",
                    type: SavingsOperationType.DEPOSIT,
                    storage: SavingsStorage.CASH,
                    amount: 200,
                    currency: CURRENCY.EUR,
                    date: "2026-09-02",
                },
            ],
        }),
    );

    assert.equal(model.savings.card, 2300);
    assert.equal(model.savings.cash, 200 * 48);
    assert.equal(model.savings.total, 2300 + 200 * 48);
    assert.equal(model.summary.savingsTotal, 2300 + 200 * 48);

    const eur = model.savings.slices.find((slice) => slice.currency === CURRENCY.EUR);
    assert.equal(eur?.cash, 200);
    assert.equal(eur?.card, 0);
});

test("a missing rate leaves the savings total unknown instead of guessing zero", () => {
    const model = buildReportModel(
        baseInput([], {
            rates: { usdToUah: 0, eurToUah: 0 },
            savingsOperations: [
                {
                    id: "1",
                    type: SavingsOperationType.DEPOSIT,
                    storage: SavingsStorage.CASH,
                    amount: 200,
                    currency: CURRENCY.EUR,
                    date: "2026-09-02",
                },
            ],
        }),
    );

    assert.equal(model.savings.total, null);
    assert.equal(model.summary.savingsTotal, null);
});

test("goal progress is measured against the shared pool and clamps at 100 percent", () => {
    const model = buildReportModel(
        baseInput([], {
            savingsGoals: [
                {
                    id: "g1",
                    name: "laptop",
                    targetAmount: 2000,
                    currency: CURRENCY.UAH,
                    monthlyContribution: 500,
                    createdAt: "2026-01-01",
                },
                {
                    id: "g2",
                    name: "car",
                    targetAmount: 100000,
                    currency: CURRENCY.UAH,
                    monthlyContribution: 5000,
                    createdAt: "2026-01-01",
                },
            ],
            savingsOperations: [
                {
                    id: "1",
                    type: SavingsOperationType.DEPOSIT,
                    storage: SavingsStorage.CARD,
                    amount: 3000,
                    currency: CURRENCY.UAH,
                    date: "2026-09-01",
                },
            ],
        }),
    );

    const [laptop, car] = model.savings.goals;

    assert.equal(laptop.progress, 100);
    assert.equal(laptop.covered, 2000);
    assert.equal(laptop.missing, 0);
    assert.equal(car.covered, 3000);
    assert.equal(car.missing, 97000);
    assert.equal(car.progress, 3);
});
