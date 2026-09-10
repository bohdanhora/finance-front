import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import { TransactionType } from "../types/transactions";
import { monthResult } from "../lib/statistics";

const expense = (value: number, categorie = "groceries"): TransactionType => ({
    id: "e" + value + categorie,
    transactionType: TransactionEnum.EXPENSE,
    description: "purchase",
    value,
    date: "2026-09-05",
    categorie,
});

const income = (value: number): TransactionType => ({
    id: "i" + value,
    transactionType: TransactionEnum.INCOME,
    description: "salary",
    value,
    date: "2026-09-01",
    categorie: "income",
});

test("the month result is income minus every expense", () => {
    const result = monthResult([income(50000), expense(20000), expense(10000)]);

    assert.equal(result.net, 20000);
    assert.equal(result.keptShare, 40);
});

test("money moved to savings counts as kept rather than spent", () => {
    const result = monthResult([income(50000), expense(20000), expense(10000, "savings")]);

    assert.equal(result.net, 20000);
    assert.equal(result.movedToSavings, 10000);
    assert.equal(result.kept, 30000);
    assert.equal(result.keptShare, 60);
});

test("spending past income shows as a negative share", () => {
    const result = monthResult([income(76722.59), expense(75773.17), expense(5000)]);

    assert.ok(result.kept < 0);
    assert.ok((result.keptShare ?? 0) < 0);
});

test("without income there is no share to report", () => {
    const result = monthResult([expense(1000)]);

    assert.equal(result.net, -1000);
    assert.equal(result.keptShare, null);
});
