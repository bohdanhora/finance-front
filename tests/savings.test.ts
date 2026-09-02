import assert from "node:assert/strict";
import test from "node:test";

import { CURRENCY } from "../constants/index";
import { getSavingsBalance, getSavingsNativeBalance } from "../lib/savings";
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
