import assert from "node:assert/strict";
import test from "node:test";

import { buildAccountSnapshot, type AssistantContextInput } from "../lib/assistant/context";
import {
    ASSISTANT_PROVIDERS,
    DEFAULT_PROVIDER_ID,
    getProvider,
    isProviderId,
    supportsEffort,
    supportsFallbacks,
    usableModels,
} from "../lib/assistant/providers";
import { CURRENCY, TransactionEnum } from "../constants/index";
import { SavingsOperationType, SavingsStorage, type TransactionType } from "../types/transactions";

const TODAY = new Date("2026-09-12T10:00:00Z");

const transaction = (item: Partial<TransactionType> & Pick<TransactionType, "id" | "value" | "date">) =>
    ({
        transactionType: TransactionEnum.EXPENSE,
        categorie: "groceries",
        description: "",
        ...item,
    }) as TransactionType;

const input = (extra: Partial<AssistantContextInput> = {}): AssistantContextInput => ({
    today: TODAY,
    currency: CURRENCY.UAH,
    totalAmount: 18000,
    totalIncome: 40000,
    totalSpend: 22000,
    nextMonthTotalAmount: 0,
    percentage: 10,
    essentials: [],
    nextMonthEssentials: [],
    expectedIncomes: [],
    transactions: [],
    savingsGoals: [],
    savingsOperations: [],
    streak: null,
    rates: { usdToUah: 40, eurToUah: 45 },
    bank: null,
    ...extra,
});

test("opens with the date, the currency and what is left of the month", () => {
    const snapshot = buildAccountSnapshot(input());

    assert.match(snapshot, /Today: 2026-09-12/);
    assert.match(snapshot, /current month 2026-09, 19 days left/);
    assert.match(snapshot, /Account currency: UAH/);
    assert.match(snapshot, /Current balance: 18000\.00/);
    assert.match(snapshot, /Savings percent set by the user: 10% \(that is 1800\.00/);
});

test("counts the bills that are still due into the projection", () => {
    const snapshot = buildAccountSnapshot(
        input({
            essentials: [
                { id: "1", title: "Rent", amount: 12000, checked: false },
                { id: "2", title: "Internet", amount: 500, checked: true, paidAmount: 450 },
            ],
            expectedIncomes: [{ id: "3", title: "Salary", amount: 30000, day: 20, recurring: true, received: false }],
        }),
    );

    assert.match(snapshot, /- \[due\] Rent: 12000\.00/);
    assert.match(snapshot, /- \[paid\] Internet: planned 500\.00, paid 450\.00/);
    assert.match(snapshot, /still to pay: 12000\.00/);
    assert.match(snapshot, /Bills still to pay this month: 12000\.00/);
    assert.match(snapshot, /Money still to receive this month: 30000\.00/);
    assert.match(snapshot, /Projected free money after the remaining bills: 36000\.00/);
});

test("lists recent transactions newest first and stops at the limit", () => {
    const snapshot = buildAccountSnapshot(
        input({
            transactionLimit: 2,
            transactions: [
                transaction({ id: "old", value: 100, date: "2026-09-01", description: "oldest" }),
                transaction({ id: "new", value: 300, date: "2026-09-11", description: "newest" }),
                transaction({ id: "mid", value: 200, date: "2026-09-05", description: "middle" }),
            ],
        }),
    );

    const rows = snapshot
        .split("\n")
        .filter((row) => row.includes("| expense |"))
        .map((row) => row.trim());

    assert.equal(rows.length, 2);
    assert.match(rows[0], /2026-09-11 \| expense \| groceries \| 300\.00 \| newest/);
    assert.match(rows[1], /2026-09-05 \| expense \| groceries \| 200\.00 \| middle/);
    assert.doesNotMatch(snapshot, /oldest/);
});

test("splits savings between cash and cards", () => {
    const snapshot = buildAccountSnapshot(
        input({
            savingsOperations: [
                {
                    id: "a",
                    type: SavingsOperationType.DEPOSIT,
                    storage: SavingsStorage.CARD,
                    amount: 5000,
                    currency: CURRENCY.UAH,
                    date: "2026-08-01",
                },
                {
                    id: "b",
                    type: SavingsOperationType.DEPOSIT,
                    storage: SavingsStorage.CASH,
                    amount: 1500,
                    currency: CURRENCY.UAH,
                    date: "2026-08-02",
                },
            ],
            savingsGoals: [
                {
                    id: "goal",
                    name: "Laptop",
                    targetAmount: 60000,
                    currency: CURRENCY.UAH,
                    monthlyContribution: 5000,
                    createdAt: "2026-07-01",
                },
            ],
        }),
    );

    assert.match(snapshot, /Total in UAH: 6500\.00/);
    assert.match(snapshot, /Cash: 1500\.00, on cards: 5000\.00/);
    assert.match(snapshot, /- Laptop: target 60000\.00 UAH, monthly plan 5000\.00/);
});

test("adds the bank section only when the bank is connected", () => {
    assert.doesNotMatch(buildAccountSnapshot(input()), /Monobank/);

    const snapshot = buildAccountSnapshot(
        input({
            bank: {
                name: "Test Client",
                accounts: [{ label: "Black 1234", currency: "UAH", balance: 652.82, creditLimit: 0 }],
                jars: [],
                statement: {
                    days: 31,
                    currency: "UAH",
                    spent: 17763.42,
                    received: 18388.23,
                    cashback: 49.95,
                    count: 49,
                    topCategories: [{ category: "groceries", amount: 5000 }],
                },
            },
        }),
    );

    assert.match(snapshot, /## Monobank \(read-only mirror/);
    assert.match(snapshot, /- Black 1234 \(UAH\): own money 652\.82/);
    assert.match(snapshot, /spent 17763\.42, received 18388\.23, cashback 49\.95, 49 operations/);
    assert.match(snapshot, /Where it went: groceries 5000\.00/);
});

test("knows which models take an effort setting", () => {
    assert.equal(supportsEffort("claude-opus-5"), true);
    assert.equal(supportsEffort("claude-sonnet-5"), true);
    assert.equal(supportsEffort("claude-haiku-4-5"), false);
    assert.equal(supportsEffort("some-model-typed-by-hand"), false);
});

test("asks for a refusal fallback only where it exists", () => {
    assert.equal(supportsFallbacks("claude-opus-5"), true);
    assert.equal(supportsFallbacks("claude-haiku-4-5"), false);
    assert.equal(supportsFallbacks("gpt-5"), false);
});

test("knows every provider it offers", () => {
    assert.equal(ASSISTANT_PROVIDERS[0].id, DEFAULT_PROVIDER_ID);
    assert.equal(getProvider("xai").baseURL, "https://api.x.ai/v1");
    assert.equal(getProvider("openai").kind, "openai");
    assert.equal(getProvider("anthropic").kind, "anthropic");
    assert.equal(getProvider("nonsense").id, DEFAULT_PROVIDER_ID);
    assert.equal(isProviderId("openrouter"), true);
    assert.equal(isProviderId("nonsense"), false);
});

test("drops non chat models from a provider listing", () => {
    const models = usableModels([
        "gpt-5",
        "gpt-5",
        "text-embedding-3-large",
        "whisper-1",
        "dall-e-3",
        "gpt-4o-audio-preview",
        "claude-opus-5",
    ]);

    assert.deepEqual(models, ["claude-opus-5", "gpt-5"]);
});

test("puts the well known models of a provider on top", () => {
    const models = usableModels(["aa-model", "gpt-4.1", "zz-model", "gpt-5"], ["gpt-5", "gpt-4.1", "missing-one"]);

    assert.deepEqual(models, ["gpt-5", "gpt-4.1", "aa-model", "zz-model"]);
});
