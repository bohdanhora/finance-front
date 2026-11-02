import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import { TransactionType } from "../types/transactions";
import { essentialSplit, monthResult } from "../lib/statistics";
import { suggestEssentialCategory } from "../lib/essential-category";

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

test("essential spending covers flagged payments and legacy essentials, never savings", () => {
    const split = essentialSplit([
        income(50000),
        { ...expense(1100, "subscriptions"), essential: true },
        expense(16000, "essentials"),
        expense(2900),
        expense(5000, "savings"),
    ]);

    assert.equal(split.essential, 17100);
    assert.equal(split.flexible, 2900);
    assert.equal(split.essentialCount, 2);
    assert.equal(Math.round(split.essentialShare), 86);
    assert.deepEqual(
        split.categories.map((slice) => slice.name),
        ["essentials", "subscriptions"],
    );
});

test("bill titles suggest a category", () => {
    assert.equal(suggestEssentialCategory("Лиза Кредит за телефон"), "credit");
    assert.equal(suggestEssentialCategory("Netflix"), "subscriptions");
    assert.equal(suggestEssentialCategory("OpenAI GPT"), "subscriptions");
    assert.equal(suggestEssentialCategory("Квартплата"), "housing");
    assert.equal(suggestEssentialCategory("Коммунальные услуги"), "utilities");
    assert.equal(suggestEssentialCategory("Astra интернет"), "utilities");
    assert.equal(suggestEssentialCategory("Пополнение мобильного бабушке"), "utilities");
    assert.equal(suggestEssentialCategory("Пилатес Лиза"), "health");
    assert.equal(suggestEssentialCategory("MyWaterShop"), null);
});
