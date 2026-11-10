import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import { TransactionType } from "../types/transactions";
import {
    byCategory,
    categoryDeltas,
    categoryDetails,
    categoryHistory,
    essentialSplit,
    excludeCategories,
    forecastPeriod,
    groupByDescription,
    hiddenSummary,
    monthResult,
    monthTotals,
    searchTransactions,
    weekdaySpending,
} from "../lib/statistics";
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

test("hidden categories drop out of the spending totals but income stays", () => {
    const month = [income(50000), expense(3000, "restaurant"), expense(2000), expense(500, "restaurant")];
    const hidden = new Set(["restaurant"]);
    const visible = excludeCategories(month, hidden);

    assert.equal(visible.length, 2);
    assert.equal(monthResult(visible).net, 48000);
    assert.deepEqual(hiddenSummary(month, hidden), {
        categories: [{ name: "restaurant", value: 3500, percent: 100 }],
        total: 3500,
    });
    assert.equal(excludeCategories(month, new Set()), month);
});

test("category details group purchases by description", () => {
    const details = categoryDetails(
        [
            { ...expense(300), description: "Silpo", date: "2026-09-02" },
            { ...expense(700), description: " silpo  ", date: "2026-09-10" },
            { ...expense(400), description: "ATB" },
            expense(900, "restaurant"),
        ],
        "groceries",
    );

    assert.deepEqual(
        details.map((group) => [group.label, group.value, group.count, group.percent]),
        [
            ["Silpo", 1000, 2, 71.4],
            ["ATB", 400, 1, 28.6],
        ],
    );
    assert.equal(details[0].lastDate, "2026-09-10");
});

test("the median purchase ignores one large bill", () => {
    const totals = monthTotals([expense(8000, "housing"), expense(300), expense(500), expense(400)]);

    assert.equal(totals.averageExpense, 2300);
    assert.equal(totals.medianExpense, 450);
});

test("merchants group across categories and search matches descriptions and categories", () => {
    const items = [
        { ...expense(300), description: "Silpo" },
        { ...expense(200, "delivery"), description: "silpo" },
        { ...expense(900, "restaurant"), description: "Kanapa" },
    ];

    const [kanapa, silpo] = groupByDescription(items);
    assert.equal(kanapa.label, "Kanapa");
    assert.deepEqual(silpo.categories, ["groceries", "delivery"]);
    assert.equal(silpo.value, 500);
    assert.equal(searchTransactions(items, "SIL", (name) => name).length, 2);
    assert.equal(searchTransactions(items, "restau", (name) => name).length, 1);
    assert.equal(searchTransactions(items, "  ", (name) => name).length, 3);
});

test("category deltas compare with the previous period", () => {
    const deltas = categoryDeltas(
        byCategory([expense(3000), expense(500, "transport")]),
        byCategory([expense(2400), expense(900, "clothing")]),
    );

    assert.deepEqual(deltas.get("groceries"), { previous: 2400, change: 600 });
    assert.deepEqual(deltas.get("transport"), { previous: 0, change: 500 });
    assert.equal(deltas.has("clothing"), false);
});

test("weekday spending starts on monday and reports the weekend share", () => {
    const { points, weekendShare } = weekdaySpending([
        { ...expense(100), date: "2026-11-09" },
        { ...expense(300), date: "2026-11-14" },
        { ...expense(100), date: "2026-11-15" },
        income(5000),
    ]);

    assert.equal(points[0].value, 100);
    assert.equal(points[5].value, 300);
    assert.equal(points[6].count, 1);
    assert.equal(weekendShare, 80);
});

test("category history averages the earlier months that had spending", () => {
    const { points, average } = categoryHistory(
        [
            { ...expense(1000), date: "2026-09-10" },
            { ...expense(3000), date: "2026-10-10" },
            { ...expense(5000), date: "2026-11-10" },
            { ...expense(700, "transport"), date: "2026-10-10" },
        ],
        "groceries",
        "2026-11",
        3,
    );

    assert.deepEqual(
        points.map((point) => point.value),
        [1000, 3000, 5000],
    );
    assert.equal(average, 2000);
});

test("the forecast keeps one-off bills fixed and extends everyday spending", () => {
    const forecast = forecastPeriod({
        transactions: [income(40000), expense(8000, "essentials"), expense(1000), expense(2000)],
        elapsed: 10,
        total: 30,
        outstandingPayments: 1500,
        pendingIncome: 10000,
    });

    assert.equal(forecast.expense, 8000 + 9000 + 1500);
    assert.equal(forecast.income, 50000);
    assert.equal(forecast.net, 50000 - 18500);
});

test("the forecast counts unusually large purchases once", () => {
    const forecast = forecastPeriod({
        transactions: [expense(300), expense(400), expense(500), expense(6000, "electronics")],
        elapsed: 10,
        total: 30,
    });

    assert.equal(forecast.expense, 6000 + 1200 * 3);
});
