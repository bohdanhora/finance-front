import { CategoryKey } from "../constants/categories";
import { MonobankAccount, MonobankJar, MonobankStatementItem } from "../types/monobank";

export const MONOBANK_TOKEN_STORAGE_KEY = "monobank-token";
export const MONOBANK_PROFILE_STORAGE_KEY = "monobank-profile";
export const MONOBANK_TOKEN_EVENT = "finance:monobank-token";

export const MONOBANK_COOLDOWN_MS = 60 * 1000;
export const MONOBANK_MAX_STATEMENT_DAYS = 31;

export const readMonobankToken = (): string | null => {
    if (typeof window === "undefined") return null;

    try {
        return localStorage.getItem(MONOBANK_TOKEN_STORAGE_KEY) || null;
    } catch {
        return null;
    }
};

export const saveMonobankToken = (token: string) => {
    try {
        localStorage.setItem(MONOBANK_TOKEN_STORAGE_KEY, token.trim());
    } catch {}
    window.dispatchEvent(new Event(MONOBANK_TOKEN_EVENT));
};

export const clearMonobankToken = () => {
    try {
        localStorage.removeItem(MONOBANK_TOKEN_STORAGE_KEY);
        localStorage.removeItem(MONOBANK_PROFILE_STORAGE_KEY);
    } catch {}
    clearMonobankHistory();
    window.dispatchEvent(new Event(MONOBANK_TOKEN_EVENT));
};

export type MonobankProfileSnapshot = {
    name: string;
    accounts: number;
    jars: number;
};

export const readMonobankProfile = (): MonobankProfileSnapshot | null => {
    if (typeof window === "undefined") return null;

    try {
        const raw = localStorage.getItem(MONOBANK_PROFILE_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as MonobankProfileSnapshot;
        return typeof parsed?.name === "string" ? parsed : null;
    } catch {
        return null;
    }
};

export const saveMonobankProfile = (snapshot: MonobankProfileSnapshot) => {
    try {
        localStorage.setItem(MONOBANK_PROFILE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {}
};

export const fromMinorUnits = (value: number) => value / 100;

const CURRENCY_SYMBOLS: Record<number, string> = {
    980: "₴",
    840: "$",
    978: "€",
    826: "£",
    985: "zł",
    756: "CHF",
    124: "C$",
    392: "¥",
};

const CURRENCY_CODES: Record<number, string> = {
    980: "UAH",
    840: "USD",
    978: "EUR",
    826: "GBP",
    985: "PLN",
    756: "CHF",
    124: "CAD",
    392: "JPY",
};

export const currencySymbolByCode = (code: number) => CURRENCY_SYMBOLS[code] || CURRENCY_CODES[code] || String(code);

export const currencyNameByCode = (code: number) => CURRENCY_CODES[code] || String(code);

const MCC_CATEGORIES: Record<number, CategoryKey> = {
    742: "pets",
    1711: "repairs",
    1731: "repairs",
    1740: "repairs",
    1750: "repairs",
    1761: "repairs",
    1771: "repairs",
    1799: "repairs",
    4111: "transport",
    4112: "transport",
    4121: "transport",
    4131: "transport",
    4784: "transport",
    4789: "transport",
    4812: "electronics",
    4814: "utilities",
    4815: "utilities",
    4821: "utilities",
    4899: "subscriptions",
    4829: "transfers",
    4900: "utilities",
    4411: "travel",
    4457: "travel",
    4468: "travel",
    4511: "travel",
    4582: "travel",
    4722: "travel",
    4723: "travel",
    5200: "home",
    5211: "repairs",
    5231: "repairs",
    5251: "repairs",
    5261: "home",
    5300: "groceries",
    5309: "groceries",
    5310: "groceries",
    5311: "clothing",
    5331: "groceries",
    5399: "home",
    5411: "groceries",
    5412: "groceries",
    5422: "groceries",
    5441: "groceries",
    5451: "groceries",
    5462: "groceries",
    5499: "groceries",
    5511: "car",
    5532: "car",
    5533: "car",
    5541: "car",
    5542: "car",
    5571: "car",
    5592: "car",
    5599: "car",
    5611: "clothing",
    5621: "clothing",
    5631: "clothing",
    5641: "children",
    5651: "clothing",
    5655: "clothing",
    5661: "clothing",
    5681: "clothing",
    5691: "clothing",
    5697: "clothing",
    5698: "cosmetics",
    5699: "clothing",
    5712: "home",
    5713: "home",
    5714: "home",
    5718: "home",
    5719: "home",
    5722: "electronics",
    5732: "electronics",
    5733: "entertainment",
    5734: "electronics",
    5735: "entertainment",
    5811: "restaurant",
    5812: "restaurant",
    5813: "restaurant",
    5814: "restaurant",
    5815: "subscriptions",
    5816: "subscriptions",
    5817: "subscriptions",
    5818: "subscriptions",
    5912: "pharmacy",
    5921: "groceries",
    5931: "clothing",
    5940: "entertainment",
    5941: "entertainment",
    5942: "education",
    5943: "work",
    5944: "gifts",
    5945: "children",
    5946: "electronics",
    5947: "gifts",
    5948: "clothing",
    5949: "home",
    5950: "home",
    5960: "insurance",
    5964: "clothing",
    5965: "clothing",
    5969: "clothing",
    5970: "gifts",
    5977: "cosmetics",
    5992: "gifts",
    5994: "education",
    5995: "pets",
    5996: "home",
    5999: "other",
    6012: "transfers",
    6051: "transfers",
    6211: "savings",
    6300: "insurance",
    6381: "insurance",
    6399: "insurance",
    6529: "transfers",
    6530: "transfers",
    6534: "transfers",
    6536: "transfers",
    6537: "transfers",
    6538: "transfers",
    6540: "transfers",
    7011: "travel",
    7032: "travel",
    7033: "travel",
    7210: "home",
    7211: "home",
    7216: "home",
    7217: "home",
    7230: "cosmetics",
    7297: "cosmetics",
    7298: "cosmetics",
    7311: "work",
    7333: "work",
    7338: "work",
    7339: "work",
    7372: "subscriptions",
    7392: "work",
    7399: "work",
    7512: "car",
    7513: "car",
    7523: "car",
    7531: "car",
    7534: "car",
    7535: "car",
    7538: "car",
    7549: "car",
    7622: "repairs",
    7623: "repairs",
    7629: "repairs",
    7631: "repairs",
    7641: "repairs",
    7692: "repairs",
    7699: "repairs",
    7829: "entertainment",
    7832: "entertainment",
    7841: "entertainment",
    7911: "entertainment",
    7922: "entertainment",
    7929: "entertainment",
    7932: "entertainment",
    7933: "entertainment",
    7941: "health",
    7991: "entertainment",
    7992: "entertainment",
    7993: "entertainment",
    7994: "entertainment",
    7995: "entertainment",
    7996: "entertainment",
    7997: "health",
    7998: "entertainment",
    7999: "entertainment",
    8011: "health",
    8021: "health",
    8031: "health",
    8041: "health",
    8042: "health",
    8043: "health",
    8049: "health",
    8050: "health",
    8062: "health",
    8071: "health",
    8099: "health",
    8111: "work",
    8211: "education",
    8220: "education",
    8241: "education",
    8244: "education",
    8249: "education",
    8299: "education",
    8351: "children",
    8398: "charity",
    8641: "charity",
    8651: "charity",
    8661: "charity",
    8675: "charity",
    8699: "charity",
    8911: "work",
    8931: "work",
    8999: "work",
    9211: "taxes",
    9222: "taxes",
    9223: "taxes",
    9311: "taxes",
    9399: "taxes",
    9402: "taxes",
    9405: "taxes",
};

export const categoryByMcc = (mcc: number): CategoryKey => {
    const known = MCC_CATEGORIES[mcc];
    if (known) return known;

    if (mcc >= 3000 && mcc <= 3299) return "travel";
    if (mcc >= 3300 && mcc <= 3499) return "car";
    if (mcc >= 3500 && mcc <= 3999) return "travel";

    return "other";
};

export const accountLabel = (account: MonobankAccount) => {
    const type = account.type ? account.type.charAt(0).toUpperCase() + account.type.slice(1) : "Account";
    const pan = account.maskedPan?.[0];
    const tail = pan ? pan.slice(-4) : account.iban?.slice(-4);

    return tail ? `${type} ${tail}` : type;
};

export const jarProgress = (jar: MonobankJar) => {
    if (!jar.goal || jar.goal <= 0) return null;
    return Math.min(100, Math.round((jar.balance / jar.goal) * 100));
};

export type MonobankCategoryTotal = {
    category: CategoryKey;
    amount: number;
    count: number;
};

export type MonobankStatementSummary = {
    spent: number;
    received: number;
    cashback: number;
    count: number;
    largest: MonobankStatementItem | null;
    byCategory: MonobankCategoryTotal[];
};

export const summarizeStatement = (items: MonobankStatementItem[]): MonobankStatementSummary => {
    const totals = new Map<CategoryKey, MonobankCategoryTotal>();

    let spent = 0;
    let received = 0;
    let cashback = 0;
    let largest: MonobankStatementItem | null = null;

    items.forEach((item) => {
        cashback += fromMinorUnits(item.cashbackAmount || 0);

        if (item.amount >= 0) {
            received += fromMinorUnits(item.amount);
            return;
        }

        const value = fromMinorUnits(Math.abs(item.amount));
        spent += value;

        if (!largest || Math.abs(item.amount) > Math.abs(largest.amount)) {
            largest = item;
        }

        const category = categoryByMcc(item.mcc);
        const current = totals.get(category);

        if (current) {
            current.amount += value;
            current.count += 1;
            return;
        }

        totals.set(category, { category, amount: value, count: 1 });
    });

    return {
        spent,
        received,
        cashback,
        count: items.length,
        largest,
        byCategory: [...totals.values()].sort((a, b) => b.amount - a.amount),
    };
};

export const statementRange = (days: number, now: Date = new Date()) => {
    const to = Math.floor(now.getTime() / 1000);
    const safeDays = Math.min(Math.max(Math.round(days), 1), MONOBANK_MAX_STATEMENT_DAYS);

    return {
        from: to - safeDays * 24 * 60 * 60,
        to,
        days: safeDays,
    };
};

export type MonobankConversion = {
    amount: number;
    currencyCode: number;
    rate: number;
    unit: "account" | "operation";
};

export const operationConversion = (
    item: MonobankStatementItem,
    accountCurrency: number,
): MonobankConversion | null => {
    if (item.currencyCode === accountCurrency || !item.operationAmount || !item.amount) return null;

    const amount = fromMinorUnits(Math.abs(item.operationAmount));
    const base = fromMinorUnits(Math.abs(item.amount));
    const unit = amount >= base ? "account" : "operation";
    const rate = unit === "account" ? amount / base : base / amount;

    return { amount, currencyCode: item.currencyCode, rate: Math.round(rate * 100) / 100, unit };
};

export const MONOBANK_STATEMENT_LIMIT = 500;
export const MONOBANK_HISTORY_EMPTY_LIMIT = 6;
export const MONOBANK_HISTORY_FLOOR = Math.floor(Date.UTC(2017, 10, 1) / 1000);

const DAY_SECONDS = 24 * 60 * 60;
const HISTORY_WINDOW_SECONDS = MONOBANK_MAX_STATEMENT_DAYS * DAY_SECONDS;
const HISTORY_STORAGE_PREFIX = "monobank-history:";

export type MonobankHistoryWindow = {
    from: number;
    to: number;
};

export type MonobankHistory = {
    items: MonobankStatementItem[];
    from: number | null;
    to: number | null;
    gap: MonobankHistoryWindow | null;
    emptyWindows: number;
    complete: boolean;
};

export const EMPTY_MONOBANK_HISTORY: MonobankHistory = {
    items: [],
    from: null,
    to: null,
    gap: null,
    emptyWindows: 0,
    complete: false,
};

export const mergeStatementItems = (current: MonobankStatementItem[], incoming: MonobankStatementItem[]) => {
    const byId = new Map(current.map((item) => [item.id, item]));
    incoming.forEach((item) => byId.set(item.id, item));

    return [...byId.values()].sort((a, b) => b.time - a.time);
};

export const nextHistoryWindow = (history: MonobankHistory, now: number): MonobankHistoryWindow | null => {
    if (history.gap) return history.gap;

    if (history.from === null || history.to === null) {
        return { from: now - HISTORY_WINDOW_SECONDS, to: now };
    }

    if (history.to < now) {
        const from = Math.max(history.to - DAY_SECONDS, history.from);
        return { from, to: Math.min(from + HISTORY_WINDOW_SECONDS, now) };
    }

    if (history.complete) return null;

    return {
        from: Math.max(history.from - HISTORY_WINDOW_SECONDS, MONOBANK_HISTORY_FLOOR),
        to: history.from,
    };
};

export const applyHistoryWindow = (
    history: MonobankHistory,
    window: MonobankHistoryWindow,
    items: MonobankStatementItem[],
): MonobankHistory => {
    const oldest = items.length > 0 ? Math.min(...items.map((item) => item.time)) : window.from;
    const partial = items.length >= MONOBANK_STATEMENT_LIMIT && oldest > window.from && oldest < window.to;
    const backward = history.gap === null && history.from !== null && window.to <= history.from;
    const emptyWindows = backward ? (items.length === 0 ? history.emptyWindows + 1 : 0) : history.emptyWindows;
    const from = history.from === null ? window.from : Math.min(history.from, window.from);

    return {
        items: mergeStatementItems(history.items, items),
        from,
        to: history.to === null ? window.to : Math.max(history.to, window.to),
        gap: partial ? { from: window.from, to: oldest } : null,
        emptyWindows,
        complete:
            history.complete || emptyWindows >= MONOBANK_HISTORY_EMPTY_LIMIT || from <= MONOBANK_HISTORY_FLOOR,
    };
};

const historyStorageKey = (token: string, accountId: string) =>
    `${HISTORY_STORAGE_PREFIX}${token.slice(-6)}:${accountId}`;

export const readMonobankHistory = (token: string, accountId: string): MonobankHistory => {
    if (typeof window === "undefined") return EMPTY_MONOBANK_HISTORY;

    try {
        const raw = localStorage.getItem(historyStorageKey(token, accountId));
        if (!raw) return EMPTY_MONOBANK_HISTORY;

        const parsed = JSON.parse(raw) as MonobankHistory;
        return Array.isArray(parsed?.items) ? { ...EMPTY_MONOBANK_HISTORY, ...parsed } : EMPTY_MONOBANK_HISTORY;
    } catch {
        return EMPTY_MONOBANK_HISTORY;
    }
};

export const saveMonobankHistory = (token: string, accountId: string, history: MonobankHistory) => {
    try {
        localStorage.setItem(historyStorageKey(token, accountId), JSON.stringify(history));
    } catch {}
};

const clearMonobankHistory = () => {
    try {
        Object.keys(localStorage)
            .filter((key) => key.startsWith(HISTORY_STORAGE_PREFIX))
            .forEach((key) => localStorage.removeItem(key));
    } catch {}
};
