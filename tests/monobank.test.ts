import assert from "node:assert/strict";
import test from "node:test";

import {
    accountLabel,
    categoryByMcc,
    currencySymbolByCode,
    fromMinorUnits,
    jarProgress,
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
