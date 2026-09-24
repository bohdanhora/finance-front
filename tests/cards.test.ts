import assert from "node:assert/strict";
import test from "node:test";

import { TransactionEnum } from "../constants/index";
import {
    ALL_CARDS,
    availableOnCard,
    balanceForFilter,
    balanceFromAvailable,
    creditSummary,
    spendableOnCard,
    defaultCardId,
    resolveCardFilter,
    statisticsTransactions,
    transactionsForCard,
    transferDirection,
} from "../lib/cards";
import { Card, CardSkin, TransactionType } from "../types/transactions";

const card = (id: string, balance: number): Card => ({
    id,
    name: id,
    skin: CardSkin.DEFAULT,
    balance,
    createdAt: "2026-09-01T00:00:00.000Z",
});

const cards = [card("mono", 700), card("pumb", 300)];

const transaction = (id: string, fields: Partial<TransactionType>): TransactionType => ({
    id,
    transactionType: TransactionEnum.EXPENSE,
    value: 10,
    date: "2026-09-10T10:00:00.000Z",
    categorie: "food",
    description: "",
    ...fields,
});

const history = [
    transaction("legacy", {}),
    transaction("coffee", { cardId: "pumb" }),
    transaction("salary", { cardId: "mono", transactionType: TransactionEnum.INCOME }),
    transaction("move", { cardId: "mono", toCardId: "pumb", transactionType: TransactionEnum.TRANSFER }),
];

test("an untagged transaction belongs to the first card", () => {
    assert.deepEqual(
        transactionsForCard(history, "mono", cards).map((item) => item.id),
        ["legacy", "salary", "move"],
    );
});

test("a transfer shows on both cards but never in statistics", () => {
    assert.deepEqual(
        transactionsForCard(history, "pumb", cards).map((item) => item.id),
        ["coffee", "move"],
    );
    assert.deepEqual(
        statisticsTransactions(history, ALL_CARDS, cards).map((item) => item.id),
        ["legacy", "coffee", "salary"],
    );
    assert.equal(transferDirection(history[3], "pumb", cards), "in");
    assert.equal(transferDirection(history[3], "mono", cards), "out");
    assert.equal(transferDirection(history[3], ALL_CARDS, cards), "between");
});

test("a removed card falls back to all cards", () => {
    assert.equal(resolveCardFilter("gone", cards), ALL_CARDS);
    assert.equal(balanceForFilter("gone", cards, 1_000), 1_000);
    assert.equal(balanceForFilter("pumb", cards, 1_000), 300);
    assert.equal(defaultCardId(ALL_CARDS, cards), "mono");
    assert.equal(defaultCardId("pumb", cards), "pumb");
});

test("a credit card spends its own money first and then the limit", () => {
    const credit: Card = { ...card("credit", -300), creditLimit: 500 };
    const cards = [card("mono", 1000), credit];

    assert.equal(availableOnCard(credit), 200);
    assert.equal(spendableOnCard(cards, "credit", 700), 200);
    assert.equal(spendableOnCard(cards, "mono", 700), 1000);
    assert.equal(balanceFromAvailable(21200, 20000), 1200);
    assert.equal(balanceFromAvailable(17000, 20000), -3000);
    assert.deepEqual(creditSummary(cards), {
        own: 1000,
        debt: 300,
        limit: 500,
        creditLeft: 200,
        hasCredit: true,
    });
    assert.equal(creditSummary([card("mono", 50)]).hasCredit, false);
});
