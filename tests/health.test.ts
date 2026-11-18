import assert from "node:assert/strict";
import dayjs from "dayjs";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import { creditDebtTrend, cushionOf, cycleReview, limitsInCycle, subscriptionsOf } from "../lib/health";

const tx = (
    transactionType: TransactionEnum,
    value: number,
    date: string,
    categorie = "groceries",
    extra: { cardId?: string; toCardId?: string; description?: string; essential?: boolean } = {},
) => ({ transactionType, value, date, categorie, description: extra.description ?? "", ...extra });
const spend = (value: number, date: string, categorie?: string, extra = {}) =>
    tx(TransactionEnum.EXPENSE, value, date, categorie, extra);

test("the cushion counts bills plus everyday food and shows how many months savings cover", () => {
    const cushion = cushionOf({
        template: [
            { title: "Rent", amount: 25000 },
            { title: "Internet", amount: 400 },
        ],
        current: [],
        transactions: [
            spend(6000, "2026-10-10T10:00:00"),
            spend(4000, "2026-09-10T10:00:00", "pharmacy"),
            spend(2000, "2026-09-12T10:00:00"),
            spend(99999, "2026-10-11T10:00:00", "electronics"),
        ],
        saved: 63200,
        today: new Date(2026, 10, 18),
    });

    assert.equal(cushion.bills, 25400);
    assert.equal(cushion.living, 6000);
    assert.equal(cushion.monthlyNeed, 31400);
    assert.equal(cushion.months, 2);
    assert.equal(cushion.target.min, 94200);
    assert.equal(cushion.missingToMin, 31000);
});

test("credit card debt is rebuilt per pay cycle from card movements", () => {
    const cards = [
        { id: "own", balance: 5000, createdAt: "2026-01-01" },
        { id: "credit", balance: -12000, creditLimit: 40000, createdAt: "2026-01-01" },
    ];
    const transactions = [
        spend(4000, "2026-09-05T10:00:00", "food", { cardId: "credit" }),
        spend(5000, "2026-10-05T10:00:00", "food", { cardId: "credit" }),
        tx(TransactionEnum.TRANSFER, 2000, "2026-10-31T10:00:00", "transfers", { cardId: "own", toCardId: "credit" }),
        spend(5000, "2026-11-05T10:00:00", "food", { cardId: "credit" }),
    ];

    const trend = creditDebtTrend({ cards, transactions, payday: 30, cycles: 3, today: new Date(2026, 10, 18) });

    assert.deepEqual(
        trend.points.map((point) => [point.date.format("YYYY-MM-DD"), point.debt]),
        [
            ["2026-08-30", 0],
            ["2026-09-30", 4000],
            ["2026-10-30", 9000],
            ["2026-11-18", 12000],
        ],
    );
    assert.equal(trend.status, "growing");
    assert.equal(trend.growingCycles, 3);
    assert.equal(trend.change, 3000);
});

test("without credit cards there is no debt trend", () => {
    const trend = creditDebtTrend({ cards: [{ id: "a", balance: 100, createdAt: "2026-01-01" }], transactions: [] });

    assert.equal(trend.status, "none");
});

test("category limits compare the cycle's spending with the share of the cycle that passed", () => {
    const progress = limitsInCycle({
        transactions: [
            spend(3000, "2026-11-02T10:00:00", "restaurant"),
            spend(900, "2026-11-03T10:00:00", "groceries"),
            spend(500, "2026-10-20T10:00:00", "restaurant"),
        ],
        limits: { restaurant: 4000, groceries: 6000, taxi: 1000 },
        start: dayjs("2026-10-30"),
        daysElapsed: 10,
        daysTotal: 30,
        today: new Date(2026, 10, 8),
    });

    assert.deepEqual(
        progress.map((item) => [item.category, item.spent, item.status]),
        [
            ["restaurant", 3000, "ahead"],
            ["groceries", 900, "ok"],
            ["taxi", 0, "ok"],
        ],
    );
});

test("the cycle review shows what was kept, what grew and which limits broke", () => {
    const transactions = [
        tx(TransactionEnum.INCOME, 100000, "2026-10-30T10:00:00", "income"),
        spend(25000, "2026-11-15T10:00:00", "housing", { essential: true }),
        spend(10000, "2026-11-01T10:00:00", "savings"),
        spend(9000, "2026-11-10T10:00:00", "restaurant"),
        spend(30000, "2026-11-12T10:00:00", "groceries"),
        spend(4000, "2026-10-10T10:00:00", "restaurant"),
        spend(32000, "2026-10-12T10:00:00", "groceries"),
        spend(100, "2026-10-13T10:00:00", "groceries"),
        spend(100, "2026-10-14T10:00:00", "groceries"),
        spend(100, "2026-10-15T10:00:00", "groceries"),
    ];

    const review = cycleReview({
        transactions,
        period: { start: dayjs("2026-10-30"), end: dayjs("2026-11-30") },
        previous: { start: dayjs("2026-09-30"), end: dayjs("2026-10-30") },
        limits: { restaurant: 6000, groceries: 35000 },
    });

    assert.equal(review.income, 100000);
    assert.equal(review.spending, 64000);
    assert.equal(review.saved, 10000);
    assert.equal(review.kept, 36000);
    assert.equal(review.flexible, 39000);
    assert.equal(Math.round((review.spendingChange ?? 0) * 100), 76);
    assert.deepEqual(
        review.grew.map((item) => [item.category, item.change]),
        [["restaurant", 5000]],
    );
    assert.deepEqual(review.overLimits, [{ category: "restaurant", limit: 6000, spent: 9000 }]);
});

test("subscriptions come from planned bills and from repeating subscription spending", () => {
    const result = subscriptionsOf({
        template: [
            { title: "Netflix", amount: 300, category: "subscriptions" },
            { title: "Rent", amount: 25000, category: "housing" },
        ],
        current: [{ title: "netflix ", amount: 300, category: "subscriptions" }],
        transactions: [
            spend(200, "2026-09-03T10:00:00", "subscriptions", { description: "Spotify" }),
            spend(200, "2026-10-03T10:00:00", "subscriptions", { description: "spotify" }),
            spend(150, "2026-10-04T10:00:00", "subscriptions", { description: "One-off app" }),
        ],
        today: new Date(2026, 10, 18),
    });

    assert.deepEqual(
        result.items.map((item) => [item.title, item.monthly, item.source]),
        [
            ["Netflix", 300, "plan"],
            ["Spotify", 200, "spending"],
        ],
    );
    assert.equal(result.monthly, 500);
    assert.equal(result.yearly, 6000);
});
