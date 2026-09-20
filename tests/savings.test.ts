import assert from "node:assert/strict";
import test from "node:test";

import { CURRENCY } from "../constants/index";
import { roundMoney, toMoneyInput, toRateInput } from "../lib/money";
import {
    calculateSavingsPace,
    getExchangeRate,
    getSavingsBalance,
    getSavingsNativeBalance,
    getUrlHost,
    normalizeGoalUrl,
} from "../lib/savings";
import { SavingsOperation, SavingsOperationType, SavingsStorage } from "../types/transactions";

const rates = {
    usdToUah: 41,
    eurToUah: 51.35,
};

const operation = (
    item: Partial<SavingsOperation> & Pick<SavingsOperation, "id" | "type" | "storage" | "amount" | "currency">,
): SavingsOperation => ({
    date: "2026-09-02T12:00:00.000Z",
    ...item,
});

const baseOperations: SavingsOperation[] = [
    operation({
        id: "bank-uah",
        type: SavingsOperationType.DEPOSIT,
        storage: SavingsStorage.CARD,
        amount: 800,
        currency: CURRENCY.UAH,
    }),
    operation({
        id: "cash-uah",
        type: SavingsOperationType.DEPOSIT,
        storage: SavingsStorage.CASH,
        amount: 1_500,
        currency: CURRENCY.UAH,
    }),
    operation({
        id: "cash-eur",
        type: SavingsOperationType.DEPOSIT,
        storage: SavingsStorage.CASH,
        amount: 200,
        currency: CURRENCY.EUR,
    }),
];

test("calculates the shown UAH equivalents for the complete, bank and cash balances", () => {
    assert.equal(getSavingsBalance(baseOperations, CURRENCY.UAH, rates), 12_570);
    assert.equal(getSavingsBalance(baseOperations, CURRENCY.UAH, rates, SavingsStorage.CARD), 800);
    assert.equal(getSavingsBalance(baseOperations, CURRENCY.UAH, rates, SavingsStorage.CASH), 11_770);
});

test("keeps actual amounts separated by storage and currency", () => {
    assert.equal(getSavingsNativeBalance(baseOperations, CURRENCY.UAH), 2_300);
    assert.equal(getSavingsNativeBalance(baseOperations, CURRENCY.EUR), 200);
    assert.equal(getSavingsNativeBalance(baseOperations, CURRENCY.UAH, SavingsStorage.CARD), 800);
    assert.equal(getSavingsNativeBalance(baseOperations, CURRENCY.UAH, SavingsStorage.CASH), 1_500);
    assert.equal(getSavingsNativeBalance(baseOperations, CURRENCY.EUR, SavingsStorage.CASH), 200);
});

test("withdrawals reduce only their selected storage and currency", () => {
    const operations = [
        operation({
            id: "cash-eur-withdrawal",
            type: SavingsOperationType.WITHDRAWAL,
            storage: SavingsStorage.CASH,
            amount: 50,
            currency: CURRENCY.EUR,
        }),
        ...baseOperations,
    ];

    assert.equal(getSavingsNativeBalance(operations, CURRENCY.EUR, SavingsStorage.CASH), 150);
    assert.equal(getSavingsNativeBalance(operations, CURRENCY.UAH, SavingsStorage.CASH), 1_500);
    assert.equal(getSavingsNativeBalance(operations, CURRENCY.UAH, SavingsStorage.CARD), 800);
});

test("transfers change storage balances without changing total savings", () => {
    const operations = [
        operation({
            id: "cash-to-bank",
            type: SavingsOperationType.TRANSFER,
            storage: SavingsStorage.CASH,
            destinationStorage: SavingsStorage.CARD,
            amount: 300,
            currency: CURRENCY.UAH,
        }),
        ...baseOperations,
    ];

    assert.equal(getSavingsNativeBalance(operations, CURRENCY.UAH), 2_300);
    assert.equal(getSavingsNativeBalance(operations, CURRENCY.UAH, SavingsStorage.CASH), 1_200);
    assert.equal(getSavingsNativeBalance(operations, CURRENCY.UAH, SavingsStorage.CARD), 1_100);
});

test("reports unavailable conversion rates only when conversion is actually needed", () => {
    const missingRates = { usdToUah: 0, eurToUah: 0 };

    assert.equal(getSavingsBalance(baseOperations, CURRENCY.UAH, missingRates), null);
    assert.equal(getSavingsBalance(baseOperations, CURRENCY.UAH, missingRates, SavingsStorage.CARD), 800);
});

test("rounds converted savings to whole cents", () => {
    const operations = [
        operation({
            id: "card-usd",
            type: SavingsOperationType.DEPOSIT,
            storage: SavingsStorage.CARD,
            amount: 0.1,
            currency: CURRENCY.USD,
        }),
        operation({
            id: "card-usd-second",
            type: SavingsOperationType.DEPOSIT,
            storage: SavingsStorage.CARD,
            amount: 0.2,
            currency: CURRENCY.USD,
        }),
    ];

    assert.equal(getSavingsNativeBalance(operations, CURRENCY.USD), 0.3);
    assert.equal(getSavingsBalance(operations, CURRENCY.USD, rates), 0.3);
});

test("keeps the goal pace free of float noise", () => {
    const pace = calculateSavingsPace(94898.30799999999, "2026-10-01", new Date(2026, 8, 14));

    assert.ok(pace);
    assert.equal(pace.daysRemaining, 17);
    assert.equal(pace.dailyAmount, 5582.26);
    assert.equal(pace.monthlyAmount, 94898.31);
    assert.equal(toMoneyInput(pace.monthlyAmount), "94898.31");
});

test("turns amounts into input text with at most two decimals", () => {
    assert.equal(roundMoney(0.1 + 0.2), 0.3);
    assert.equal(toMoneyInput(94898.30799999999), "94898.31");
    assert.equal(toMoneyInput(12.5), "12.5");
    assert.equal(toMoneyInput(Number.NaN), "");
});

test("normalizes a goal link the way a person types it", () => {
    assert.equal(normalizeGoalUrl("rozetka.com.ua/item"), "https://rozetka.com.ua/item");
    assert.equal(normalizeGoalUrl("  https://shop.com/p/1?a=2  "), "https://shop.com/p/1?a=2");
    assert.equal(normalizeGoalUrl(""), null);
    assert.equal(normalizeGoalUrl("just a note"), null);
    assert.equal(normalizeGoalUrl("localhost"), null);
});

test("shows the shop name for a goal link", () => {
    assert.equal(getUrlHost("https://www.rozetka.com.ua/item/"), "rozetka.com.ua");
    assert.equal(getUrlHost("not a link"), "not a link");
});

test("offers the current rate of one saved unit in the balance currency", () => {
    assert.equal(getExchangeRate(CURRENCY.USD, CURRENCY.UAH, rates), 41);
    assert.equal(getExchangeRate(CURRENCY.UAH, CURRENCY.UAH, rates), 1);
    assert.equal(roundMoney(getExchangeRate(CURRENCY.EUR, CURRENCY.USD, rates)!), 1.25);
    assert.equal(getExchangeRate(CURRENCY.USD, CURRENCY.UAH, { usdToUah: 0, eurToUah: 0 }), null);
});

test("turns a rate into input text with at most four decimals", () => {
    assert.equal(toRateInput(41.123456), "41.1235");
    assert.equal(toRateInput(0), "");
});
