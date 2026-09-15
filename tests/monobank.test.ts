import assert from "node:assert/strict";
import test from "node:test";

import {
    accountLabel,
    applyHistoryWindow,
    categoryByMcc,
    currencySymbolByCode,
    EMPTY_MONOBANK_HISTORY,
    fromMinorUnits,
    jarProgress,
    mergeStatementItems,
    MONOBANK_HISTORY_EMPTY_LIMIT,
    MONOBANK_STATEMENT_LIMIT,
    nextHistoryWindow,
    operationConversion,
    statementRange,
    summarizeStatement,
} from "../lib/monobank";
import { MonobankAccount, MonobankJar, MonobankStatementItem } from "../types/monobank";

const operation = (item: Partial<MonobankStatementItem> & Pick<MonobankStatementItem, "id" | "amount">) =>
    ({
        time: 1700000000,
        description: "Shop",
        mcc: 5411,
        originalMcc: 5411,
        operationAmount: item.amount,
        currencyCode: 980,
        commissionRate: 0,
        cashbackAmount: 0,
        balance: 100000,
        hold: false,
        ...item,
    }) as MonobankStatementItem;

test("reads minor units as money", () => {
    assert.equal(fromMinorUnits(123456), 1234.56);
    assert.equal(fromMinorUnits(-500), -5);
    assert.equal(fromMinorUnits(0), 0);
});

test("maps merchant codes onto the categories of the app", () => {
    assert.equal(categoryByMcc(5411), "groceries");
    assert.equal(categoryByMcc(4121), "transport");
    assert.equal(categoryByMcc(5814), "restaurant");
    assert.equal(categoryByMcc(3015), "travel");
    assert.equal(categoryByMcc(3360), "car");
    assert.equal(categoryByMcc(3702), "travel");
    assert.equal(categoryByMcc(4829), "transfers");
    assert.equal(categoryByMcc(6538), "transfers");
    assert.equal(categoryByMcc(1), "other");
});

test("adds a period up with spending kept positive", () => {
    const summary = summarizeStatement([
        operation({ id: "1", amount: -20000, mcc: 5411, cashbackAmount: 200 }),
        operation({ id: "2", amount: -5000, mcc: 5411 }),
        operation({ id: "3", amount: -30000, mcc: 4121 }),
        operation({ id: "4", amount: 150000, mcc: 4829 }),
    ]);

    assert.equal(summary.spent, 550);
    assert.equal(summary.received, 1500);
    assert.equal(summary.cashback, 2);
    assert.equal(summary.count, 4);
    assert.equal(summary.largest?.id, "3");
    assert.deepEqual(
        summary.byCategory.map((total) => [total.category, total.amount, total.count]),
        [
            ["transport", 300, 1],
            ["groceries", 250, 2],
        ],
    );
});

test("an empty period adds up to nothing", () => {
    const summary = summarizeStatement([]);

    assert.deepEqual(summary.byCategory, []);
    assert.equal(summary.spent, 0);
    assert.equal(summary.largest, null);
});

test("clamps a statement period to what the bank accepts", () => {
    const now = new Date("2026-09-12T10:00:00Z");
    const week = statementRange(7, now);
    const tooLong = statementRange(90, now);

    assert.equal(week.days, 7);
    assert.equal(week.to - week.from, 7 * 24 * 60 * 60);
    assert.equal(tooLong.days, 31);
    assert.equal(statementRange(0, now).days, 1);
});

test("names an account by its card, then by its iban", () => {
    const account = (extra: Partial<MonobankAccount>) =>
        ({
            id: "acc",
            sendId: "send",
            balance: 0,
            creditLimit: 0,
            type: "black",
            currencyCode: 980,
            maskedPan: [],
            iban: "UA123456789012345678901234567",
            ...extra,
        }) as MonobankAccount;

    assert.equal(accountLabel(account({ maskedPan: ["537541******1234"] })), "Black 1234");
    assert.equal(accountLabel(account({})), "Black 4567");
});

test("knows the currency symbols it draws with", () => {
    assert.equal(currencySymbolByCode(980), "₴");
    assert.equal(currencySymbolByCode(840), "$");
    assert.equal(currencySymbolByCode(123456), "123456");
});

test("reads how full a jar is", () => {
    const jar = (extra: Partial<MonobankJar>) =>
        ({ id: "jar", sendId: "send", title: "Jar", currencyCode: 980, balance: 5000, ...extra }) as MonobankJar;

    assert.equal(jarProgress(jar({ goal: 20000 })), 25);
    assert.equal(jarProgress(jar({ goal: 1000 })), 100);
    assert.equal(jarProgress(jar({})), null);
});

test("reads the rate a dollar account was sold at", () => {
    const sold = operationConversion(
        operation({ id: "sell", amount: -237487, operationAmount: -9760000, currencyCode: 980 }),
        840,
    );
    const abroad = operationConversion(
        operation({ id: "abroad", amount: -41500, operationAmount: -1000, currencyCode: 840 }),
        980,
    );

    assert.deepEqual(sold, { amount: 97600, currencyCode: 980, rate: 41.1, unit: "account" });
    assert.deepEqual(abroad, { amount: 10, currencyCode: 840, rate: 41.5, unit: "operation" });
    assert.equal(operationConversion(operation({ id: "local", amount: -500 }), 980), null);
});

test("merges statement pages newest first without duplicates", () => {
    const merged = mergeStatementItems(
        [operation({ id: "a", amount: -100, time: 10 }), operation({ id: "b", amount: -200, time: 30, hold: true })],
        [operation({ id: "b", amount: -200, time: 30, hold: false }), operation({ id: "c", amount: -300, time: 20 })],
    );

    assert.deepEqual(
        merged.map((item) => [item.id, item.hold]),
        [
            ["b", false],
            ["c", false],
            ["a", false],
        ],
    );
});

test("walks the history back one statement window at a time", () => {
    const now = 1_760_000_000;
    const month = 31 * 24 * 60 * 60;

    const first = nextHistoryWindow(EMPTY_MONOBANK_HISTORY, now);
    assert.deepEqual(first, { from: now - month, to: now });

    const recent = applyHistoryWindow(EMPTY_MONOBANK_HISTORY, first!, [operation({ id: "1", amount: -100, time: now - 10 })]);
    assert.deepEqual(nextHistoryWindow(recent, now), { from: now - 2 * month, to: now - month });

    const later = now + 3 * 24 * 60 * 60;
    assert.deepEqual(nextHistoryWindow(recent, later), { from: now - 24 * 60 * 60, to: later });

    let history = recent;
    for (let index = 0; index < MONOBANK_HISTORY_EMPTY_LIMIT; index += 1) {
        assert.equal(history.complete, false);
        history = applyHistoryWindow(history, nextHistoryWindow(history, now)!, []);
    }

    assert.equal(history.complete, true);
    assert.equal(nextHistoryWindow(history, now), null);
    assert.equal(history.items.length, 1);
});

test("asks for the rest of a window the bank cut at its limit", () => {
    const now = 1_760_000_000;
    const window = { from: now - 1000, to: now };
    const full = Array.from({ length: MONOBANK_STATEMENT_LIMIT }, (_, index) =>
        operation({ id: `op-${index}`, amount: -100, time: now - 1 - index }),
    );

    const cut = applyHistoryWindow(EMPTY_MONOBANK_HISTORY, window, full);
    const oldest = now - MONOBANK_STATEMENT_LIMIT;

    assert.deepEqual(cut.gap, { from: now - 1000, to: oldest });
    assert.deepEqual(nextHistoryWindow(cut, now), { from: now - 1000, to: oldest });

    const filled = applyHistoryWindow(cut, cut.gap!, [operation({ id: "older", amount: -100, time: oldest - 5 })]);
    assert.equal(filled.gap, null);
    assert.equal(filled.items.length, MONOBANK_STATEMENT_LIMIT + 1);
});
