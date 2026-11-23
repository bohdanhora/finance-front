import assert from "node:assert/strict";
import test from "node:test";

import { buildAccountSnapshot, type AssistantContextInput } from "../lib/assistant/context";
import { calculate, queryTransactions, runAssistantTool, type ProposedOperation } from "../lib/assistant/tools";
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
import { CardSkin, SavingsOperationType, SavingsStorage, type TransactionType } from "../types/transactions";

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
    assert.match(snapshot, /Next month savings percent: 10%/);
});

test("counts the bills that are still due into the pay cycle budget", () => {
    const snapshot = buildAccountSnapshot(
        input({
            cards: [{ id: "main", name: "Main", balance: 18000, createdAt: "2026-01-01" }],
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
    assert.match(snapshot, /still on the way 30000\.00/);
    assert.match(snapshot, /Cycle: 2026-08-20 to the next payday 2026-09-20/);
    assert.match(snapshot, /unpaid bills due before payday 12000\.00 = safe to spend 6000\.00/);
    assert.match(snapshot, /salary 30000\.00 - paying off all credit cards 0\.00 = 36000\.00/);
});

test("splits own money from credit card debt", () => {
    const snapshot = buildAccountSnapshot(
        input({
            totalAmount: 1800,
            cards: [
                { id: "a", name: "Mine", balance: 20000, createdAt: "2026-01-01" },
                { id: "b", name: "Credit", balance: -18200, creditLimit: 50000, createdAt: "2026-01-01" },
                { id: "c", name: "Hers", balance: 3000, personal: true, createdAt: "2026-01-01" },
            ],
        }),
    );

    assert.match(snapshot, /Own money on cards: 23000\.00, credit card debt: 18200\.00/);
    assert.match(snapshot, /- Credit: credit card, limit 50000\.00, debt 18200\.00, credit left 31800\.00/);
    assert.match(snapshot, /- Hers: balance 3000\.00, personal/);
    assert.match(snapshot, /without personal cards Hers/);
});

test("summarises every month of the history", () => {
    const snapshot = buildAccountSnapshot(
        input({
            transactions: [
                transaction({ id: "1", value: 100, date: "2025-11-03" }),
                transaction({
                    id: "2",
                    value: 900,
                    date: "2026-03-10",
                    transactionType: TransactionEnum.INCOME,
                    categorie: "income",
                }),
                transaction({ id: "3", value: 250, date: "2026-09-02", categorie: "restaurant" }),
            ],
        }),
    );

    assert.match(snapshot, /- 2025-11: income 0\.00, expenses 100\.00/);
    assert.match(snapshot, /- 2026-03: income 900\.00, expenses 0\.00/);
    assert.match(snapshot, /History: 3 transactions from 2025-11-03 to 2026-09-02/);
});

const toolData = () => ({
    cards: [
        { id: "a", name: "Mine" },
        { id: "b", name: "Credit" },
    ],
    savingsOperations: [],
    hiddenTransactions: ["hidden"],
    transactions: [
        transaction({ id: "1", value: 120.5, date: "2026-09-01", description: "Silpo", cardId: "a" }),
        transaction({ id: "2", value: 300, date: "2026-09-03", description: "silpo market", cardId: "b" }),
        transaction({ id: "3", value: 1000, date: "2026-09-05", categorie: "savings", cardId: "a" }),
        transaction({
            id: "4",
            value: 5000,
            date: "2026-09-06",
            transactionType: TransactionEnum.TRANSFER,
            categorie: "transfers",
            cardId: "a",
            toCardId: "b",
        }),
        transaction({
            id: "5",
            value: 40000,
            date: "2026-08-30",
            transactionType: TransactionEnum.INCOME,
            categorie: "income",
            cardId: "a",
        }),
        transaction({ id: "6", value: 450, date: "2026-08-15", categorie: "restaurant", cardId: "a" }),
        transaction({ id: "hidden", value: 9999, date: "2026-09-04", cardId: "a" }),
    ],
});

const query = (input: Record<string, unknown>) => {
    const result = queryTransactions(input, toolData());
    if ("error" in result) throw new Error(result.error);
    return result;
};

test("totals expenses without transfers, hidden rows or excluded categories", () => {
    const result = query({ type: "expense", from: "2026-09-01", to: "2026-09-30", excludeCategories: ["savings"] });

    assert.equal(result.count, 2);
    assert.equal(result.total, 420.5);
    assert.equal(result.expense, 420.5);
});

test("finds a merchant on one card and groups by category", () => {
    assert.equal(query({ search: "SILPO" }).total, 420.5);
    assert.equal(query({ search: "silpo", card: "credit" }).total, 300);

    const grouped = query({ type: "expense", groupBy: "category", limit: 0 });
    assert.deepEqual(grouped.groups?.[0], { key: "savings", count: 1, total: 1000 });
    assert.equal(grouped.rows?.length, 0);
    assert.equal(grouped.rowsNotShown, 4);
});

test("keeps income and expenses apart in the net result", () => {
    const result = query({ from: "2026-08-01", to: "2026-08-31" });

    assert.equal(result.income, 40000);
    assert.equal(result.expense, 450);
    assert.equal(result.net, 39550);
});

test("lists transfers only when asked", () => {
    const result = query({ type: "transfer" });

    assert.equal(result.count, 1);
    assert.equal(result.rows?.[0].card, "Mine -> Credit");
});

test("calculates exactly and rejects anything but arithmetic", () => {
    assert.equal(calculate("(45210.5 - 12000) / 17"), 1953.5588);
    assert.equal(calculate("-2 * (3 + 4) % 5"), -4);
    assert.equal(calculate("0,1 + 0,2"), 0.3);
    assert.throws(() => calculate("alert(1)"));
    assert.throws(() => calculate("1 / 0"));
    assert.match(runAssistantTool("calculate", { expression: "2+" }, toolData()), /error/);
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
    assert.doesNotMatch(snapshot, /2026-09-01 \| expense \| groceries \| 100\.00 \| oldest/);
    assert.match(snapshot, /The newest 2 are listed at the end/);
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

    assert.match(snapshot, /Savings pool in UAH: 6500\.00/);
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

test("lists the whole history and the largest expenses of every month", () => {
    const snapshot = buildAccountSnapshot(
        input({
            transactions: [
                transaction({ id: "1", value: 100, date: "2026-08-03", description: "coffee" }),
                transaction({ id: "2", value: 7400, date: "2026-08-20", description: "fridge", categorie: "home" }),
                transaction({ id: "3", value: 250, date: "2026-09-02", categorie: "restaurant" }),
            ],
        }),
    );

    assert.match(snapshot, /## All transactions \(newest first, 3 of 3\)/);
    assert.match(snapshot, /2026-08-03 \| expense \| groceries \| 100\.00 \| coffee/);
    assert.match(snapshot, /- 2026-08: .*largest expenses: 7400\.00 fridge \(home, 2026-08-20\); 100\.00 coffee/);
    assert.match(snapshot, /Every one of them is listed at the end of this snapshot/);
});

test("reads raw account sections without heavy images", () => {
    const result = JSON.parse(
        runAssistantTool(
            "get_account_data",
            { section: "cards" },
            {
                ...toolData(),
                account: {
                    cards: [
                        {
                            id: "a",
                            name: "Mine",
                            skin: CardSkin.DEFAULT,
                            balance: 10,
                            cover: "data:image/png;base64,AAAA",
                            createdAt: "2026-01-01",
                        },
                    ],
                },
            },
        ),
    );

    assert.equal(result.cards[0].name, "Mine");
    assert.equal(result.cards[0].cover, undefined);
});

test("prepares dictated operations for confirmation without saving them", () => {
    const proposed: ProposedOperation[][] = [];
    const result = JSON.parse(
        runAssistantTool(
            "add_operations",
            {
                operations: [
                    { type: "expense", amount: 250, category: "groceries", description: "Silpo" },
                    { type: "expense", amount: 80, category: "made-up", description: "coffee", date: "2026-09-11" },
                    { type: "income", amount: 1500, category: "groceries", card: "credit" },
                    { type: "transfer", amount: 300, card: "mine", toCard: "credit" },
                ],
            },
            { ...toolData(), today: TODAY, propose: (operations) => proposed.push(operations) },
        ),
    );

    assert.equal(proposed.length, 1);
    assert.deepEqual(
        proposed[0].map((item) => [item.type, item.amount, item.category, item.date, item.cardId, item.toCardId]),
        [
            ["expense", 250, "groceries", "2026-09-12", "a", undefined],
            ["expense", 80, "other", "2026-09-11", "a", undefined],
            ["income", 1500, "income", "2026-09-12", "b", undefined],
            ["transfer", 300, "transfers", "2026-09-12", "a", "b"],
        ],
    );
    assert.match(result.status, /Not saved yet/);
});

test("refuses unclear operations and proposes nothing", () => {
    const proposed: ProposedOperation[][] = [];
    const result = JSON.parse(
        runAssistantTool(
            "add_operations",
            {
                operations: [
                    { type: "expense", amount: 0 },
                    { type: "expense", amount: 10, date: "2026-09-20" },
                    { type: "transfer", amount: 10, card: "mine", toCard: "mine" },
                    { type: "expense", amount: 10, card: "nonexistent" },
                ],
            },
            { ...toolData(), today: TODAY, propose: (operations) => proposed.push(operations) },
        ),
    );

    assert.equal(proposed.length, 0);
    assert.equal(result.details.length, 4);
});
