import dayjs from "dayjs";

import { TransactionEnum } from "../../constants/index";
import { roundMoney } from "../money";
import { Card, SavingsOperation, TransactionType } from "../../types/transactions";

export type AssistantToolDefinition = {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
};

export type AssistantToolData = {
    transactions: TransactionType[];
    cards: Pick<Card, "id" | "name">[];
    savingsOperations: SavingsOperation[];
    hiddenTransactions?: string[];
};

const GROUPS = ["none", "category", "month", "week", "day", "weekday", "card", "description", "type"] as const;
const SORTS = ["date_desc", "date_asc", "amount_desc", "amount_asc"] as const;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const MAX_ITEMS = 200;
const DEFAULT_ITEMS = 25;
const MAX_GROUPS = 60;

export const ASSISTANT_TOOLS: AssistantToolDefinition[] = [
    {
        name: "query_transactions",
        description:
            "Search the full transaction history of the account and get exact totals. Use it for every question about spending, income, categories, merchants, cards or periods instead of adding numbers yourself. Transfers between the user's own cards are excluded unless type is transfer. Returns count, total, income, expense, net, average, min, max, optional groups and the matching rows.",
        parameters: {
            type: "object",
            properties: {
                from: { type: "string", description: "First day included, YYYY-MM-DD." },
                to: { type: "string", description: "Last day included, YYYY-MM-DD." },
                type: {
                    type: "string",
                    enum: ["expense", "income", "transfer", "all"],
                    description: "expense, income, transfer, or all (income and expenses, no transfers). Default all.",
                },
                categories: {
                    type: "array",
                    items: { type: "string" },
                    description: "Only these category keys, for example groceries, restaurant, savings.",
                },
                excludeCategories: {
                    type: "array",
                    items: { type: "string" },
                    description: "Leave out these category keys, for example savings to see real spending only.",
                },
                card: { type: "string", description: "Card name or id. Omit for all cards." },
                search: {
                    type: "string",
                    description: "Case-insensitive text to find in the description, for example a shop name.",
                },
                minAmount: { type: "number" },
                maxAmount: { type: "number" },
                essential: {
                    type: "boolean",
                    description: "true for payments of planned bills only, false to leave them out.",
                },
                includeHidden: {
                    type: "boolean",
                    description: "Include transactions the user hid from statistics. Default false.",
                },
                groupBy: { type: "string", enum: [...GROUPS], description: "How to group the totals. Default none." },
                sort: { type: "string", enum: [...SORTS], description: "Order of the rows. Default date_desc." },
                limit: {
                    type: "number",
                    description: `How many rows to return, 0 to ${MAX_ITEMS}. Default ${DEFAULT_ITEMS}. Totals always cover every match.`,
                },
            },
            additionalProperties: false,
        },
    },
    {
        name: "calculate",
        description:
            "Evaluate an arithmetic expression exactly. Supports + - * / % ( ) and decimals. Use it for any math that is not a single obvious step, such as differences, shares, per-day amounts or projections.",
        parameters: {
            type: "object",
            properties: {
                expression: { type: "string", description: "For example (45210.5 - 12000) / 17" },
            },
            required: ["expression"],
            additionalProperties: false,
        },
    },
    {
        name: "savings_history",
        description:
            "List the savings operations (deposits, withdrawals and moves between cash and card) with totals per currency. Use it for questions about how savings changed over time.",
        parameters: {
            type: "object",
            properties: {
                from: { type: "string", description: "First day included, YYYY-MM-DD." },
                to: { type: "string", description: "Last day included, YYYY-MM-DD." },
                limit: { type: "number", description: `Rows to return, default ${DEFAULT_ITEMS}.` },
            },
            additionalProperties: false,
        },
    },
];

type Input = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const number = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
const strings = (value: unknown) =>
    Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim().toLowerCase())
        : [];
const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
    typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : fallback;
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).isValid();
const limitOf = (value: unknown) => Math.max(0, Math.min(MAX_ITEMS, Math.floor(number(value) ?? DEFAULT_ITEMS)));

const cardName = (cards: AssistantToolData["cards"], id?: string) => {
    const index = id ? cards.findIndex((card) => card.id === id) : 0;
    const card = cards[index < 0 ? 0 : index];
    if (!card) return "";
    return card.name.trim() || `Card ${(index < 0 ? 0 : index) + 1}`;
};

const groupKey = (tx: TransactionType, by: (typeof GROUPS)[number], cards: AssistantToolData["cards"]) => {
    const date = dayjs(tx.date);
    switch (by) {
        case "category":
            return tx.categorie || "other";
        case "month":
            return date.format("YYYY-MM");
        case "week":
            return `week of ${date.subtract((date.day() + 6) % 7, "day").format("YYYY-MM-DD")}`;
        case "day":
            return date.format("YYYY-MM-DD");
        case "weekday":
            return WEEKDAYS[date.day()];
        case "card":
            return cardName(cards, tx.cardId);
        case "description":
            return tx.description.trim().replace(/\s+/g, " ").toLowerCase() || "(no description)";
        case "type":
            return tx.transactionType;
        default:
            return "";
    }
};

const row = (tx: TransactionType, cards: AssistantToolData["cards"]) => ({
    date: dayjs(tx.date).format("YYYY-MM-DD"),
    type: tx.transactionType,
    category: tx.categorie || "other",
    amount: roundMoney(tx.value),
    description: tx.description || "",
    card:
        tx.transactionType === TransactionEnum.TRANSFER
            ? `${cardName(cards, tx.cardId)} -> ${cardName(cards, tx.toCardId)}`
            : cardName(cards, tx.cardId),
    ...(tx.essential ? { bill: true } : {}),
});

export const queryTransactions = (input: Input, data: AssistantToolData) => {
    const from = text(input.from);
    const to = text(input.to);
    if ((from && !isDate(from)) || (to && !isDate(to))) return { error: "Dates must be YYYY-MM-DD." };

    const type = oneOf(input.type, ["expense", "income", "transfer", "all"] as const, "all");
    const categories = strings(input.categories);
    const excluded = strings(input.excludeCategories);
    const search = text(input.search).toLowerCase();
    const minAmount = number(input.minAmount);
    const maxAmount = number(input.maxAmount);
    const essential = typeof input.essential === "boolean" ? input.essential : undefined;
    const hidden = input.includeHidden === true ? new Set<string>() : new Set(data.hiddenTransactions ?? []);
    const groupBy = oneOf(input.groupBy, GROUPS, "none");
    const sort = oneOf(input.sort, SORTS, "date_desc");
    const limit = limitOf(input.limit);

    const cardQuery = text(input.card).toLowerCase();
    let cardId: string | undefined;
    if (cardQuery) {
        const found =
            data.cards.find((card) => card.id === text(input.card)) ??
            data.cards.find(
                (card, index) =>
                    cardName(data.cards, card.id).toLowerCase() === cardQuery || `card ${index + 1}` === cardQuery,
            ) ??
            data.cards.find((card) => cardName(data.cards, card.id).toLowerCase().includes(cardQuery));
        if (!found) {
            return {
                error: `No card matches "${input.card}".`,
                cards: data.cards.map((card) => cardName(data.cards, card.id)),
            };
        }
        cardId = found.id;
    }

    const firstCard = data.cards[0]?.id;
    const start = from ? dayjs(from).startOf("day") : null;
    const end = to ? dayjs(to).endOf("day") : null;

    const matches = data.transactions.filter((tx) => {
        const isTransfer = tx.transactionType === TransactionEnum.TRANSFER;
        if (type === "transfer" ? !isTransfer : isTransfer) return false;
        if (type === "expense" && tx.transactionType !== TransactionEnum.EXPENSE) return false;
        if (type === "income" && tx.transactionType !== TransactionEnum.INCOME) return false;
        if (hidden.has(tx.id)) return false;
        const date = dayjs(tx.date);
        if (start && date.isBefore(start)) return false;
        if (end && date.isAfter(end)) return false;
        const category = (tx.categorie || "other").toLowerCase();
        if (categories.length && !categories.includes(category)) return false;
        if (excluded.includes(category)) return false;
        if (search && !(tx.description || "").toLowerCase().includes(search)) return false;
        if (minAmount !== undefined && tx.value < minAmount) return false;
        if (maxAmount !== undefined && tx.value > maxAmount) return false;
        if (essential !== undefined && Boolean(tx.essential) !== essential) return false;
        if (cardId) {
            const own = tx.cardId ?? firstCard;
            if (own !== cardId && tx.toCardId !== cardId) return false;
        }
        return true;
    });

    const values = matches.map((tx) => tx.value);
    const income = matches.filter((tx) => tx.transactionType === TransactionEnum.INCOME);
    const expense = matches.filter((tx) => tx.transactionType === TransactionEnum.EXPENSE);
    const sum = (items: TransactionType[]) => roundMoney(items.reduce((total, tx) => total + tx.value, 0));
    const dates = matches.map((tx) => dayjs(tx.date).valueOf());

    const groups =
        groupBy === "none"
            ? undefined
            : [
                  ...matches
                      .reduce((map, tx) => {
                          const key = groupKey(tx, groupBy, data.cards);
                          const group = map.get(key) ?? { key, count: 0, total: 0 };
                          group.count += 1;
                          group.total +=
                              tx.transactionType === TransactionEnum.INCOME && type === "all" ? -tx.value : tx.value;
                          map.set(key, group);
                          return map;
                      }, new Map<string, { key: string; count: number; total: number }>())
                      .values(),
              ]
                  .map((group) => ({ ...group, total: roundMoney(group.total) }))
                  .sort((a, b) =>
                      ["month", "week", "day"].includes(groupBy)
                          ? a.key.localeCompare(b.key)
                          : Math.abs(b.total) - Math.abs(a.total),
                  );

    const sorted = [...matches].sort((a, b) => {
        if (sort === "amount_desc") return b.value - a.value;
        if (sort === "amount_asc") return a.value - b.value;
        const diff = dayjs(a.date).valueOf() - dayjs(b.date).valueOf();
        return sort === "date_asc" ? diff : -diff;
    });

    return {
        count: matches.length,
        total: roundMoney(values.reduce((total, value) => total + value, 0)),
        income: sum(income),
        expense: sum(expense),
        net: roundMoney(sum(income) - sum(expense)),
        average: matches.length ? roundMoney(values.reduce((total, value) => total + value, 0) / matches.length) : 0,
        min: values.length ? roundMoney(Math.min(...values)) : 0,
        max: values.length ? roundMoney(Math.max(...values)) : 0,
        firstDate: dates.length ? dayjs(Math.min(...dates)).format("YYYY-MM-DD") : null,
        lastDate: dates.length ? dayjs(Math.max(...dates)).format("YYYY-MM-DD") : null,
        ...(groups
            ? {
                  groups: groups.slice(0, MAX_GROUPS),
                  ...(groups.length > MAX_GROUPS ? { groupsTruncated: groups.length - MAX_GROUPS } : {}),
                  ...(type === "all" ? { groupNote: "In type all, income counts as negative inside a group." } : {}),
              }
            : {}),
        rows: sorted.slice(0, limit).map((tx) => row(tx, data.cards)),
        ...(matches.length > limit ? { rowsNotShown: matches.length - limit } : {}),
    };
};

export const calculate = (expression: string): number => {
    const source = expression.replace(/\s+/g, "").replace(/,/g, ".");
    if (!source) throw new Error("Empty expression.");
    if (!/^[\d.+\-*/%()]+$/.test(source)) throw new Error("Only numbers and + - * / % ( ) are allowed.");

    let position = 0;
    const peek = () => source[position];

    const parseNumber = (): number => {
        const match = /^(\d+\.?\d*|\.\d+)/.exec(source.slice(position));
        if (!match) throw new Error(`Unexpected "${peek() ?? "end"}" at ${position + 1}.`);
        position += match[0].length;
        return Number(match[0]);
    };

    const parseFactor = (): number => {
        if (peek() === "-") {
            position += 1;
            return -parseFactor();
        }
        if (peek() === "+") {
            position += 1;
            return parseFactor();
        }
        if (peek() === "(") {
            position += 1;
            const value = parseSum();
            if (peek() !== ")") throw new Error("Missing closing bracket.");
            position += 1;
            return value;
        }
        return parseNumber();
    };

    const parseProduct = (): number => {
        let value = parseFactor();
        while (peek() === "*" || peek() === "/" || peek() === "%") {
            const operator = source[position];
            position += 1;
            const right = parseFactor();
            if (operator === "*") value *= right;
            else if (right === 0) throw new Error("Division by zero.");
            else value = operator === "/" ? value / right : value % right;
        }
        return value;
    };

    const parseSum = (): number => {
        let value = parseProduct();
        while (peek() === "+" || peek() === "-") {
            const operator = source[position];
            position += 1;
            const right = parseProduct();
            value = operator === "+" ? value + right : value - right;
        }
        return value;
    };

    const result = parseSum();
    if (position < source.length) throw new Error(`Unexpected "${peek()}" at ${position + 1}.`);
    if (!Number.isFinite(result)) throw new Error("The result is not a finite number.");
    return Math.round(result * 10000) / 10000;
};

export const savingsHistory = (input: Input, data: AssistantToolData) => {
    const from = text(input.from);
    const to = text(input.to);
    if ((from && !isDate(from)) || (to && !isDate(to))) return { error: "Dates must be YYYY-MM-DD." };
    const limit = limitOf(input.limit);
    const start = from ? dayjs(from).startOf("day") : null;
    const end = to ? dayjs(to).endOf("day") : null;

    const matches = data.savingsOperations
        .filter((item) => (!start || !dayjs(item.date).isBefore(start)) && (!end || !dayjs(item.date).isAfter(end)))
        .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

    const totals = matches.reduce<Record<string, { deposited: number; withdrawn: number }>>((map, item) => {
        const key = item.currency.toUpperCase();
        const entry = map[key] ?? { deposited: 0, withdrawn: 0 };
        if (item.type === "deposit") entry.deposited = roundMoney(entry.deposited + item.amount);
        if (item.type === "withdrawal") entry.withdrawn = roundMoney(entry.withdrawn + item.amount);
        map[key] = entry;
        return map;
    }, {});

    return {
        count: matches.length,
        totalsByCurrency: totals,
        rows: matches.slice(0, limit).map((item) => ({
            date: dayjs(item.date).format("YYYY-MM-DD"),
            type: item.type,
            storage: item.type === "transfer" ? `${item.storage} -> ${item.destinationStorage ?? ""}` : item.storage,
            amount: roundMoney(item.amount),
            currency: item.currency.toUpperCase(),
            note: item.note || "",
        })),
        ...(matches.length > limit ? { rowsNotShown: matches.length - limit } : {}),
    };
};

export const runAssistantTool = (name: string, input: unknown, data: AssistantToolData): string => {
    const args = input && typeof input === "object" ? (input as Input) : {};

    try {
        if (name === "query_transactions") return JSON.stringify(queryTransactions(args, data));
        if (name === "savings_history") return JSON.stringify(savingsHistory(args, data));
        if (name === "calculate") return JSON.stringify({ result: calculate(text(args.expression)) });
        return JSON.stringify({ error: `Unknown tool ${name}.` });
    } catch (error) {
        return JSON.stringify({ error: error instanceof Error ? error.message : "Tool failed." });
    }
};
