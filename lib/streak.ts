/**
 * Reading the daily visit streak: which flame it lights, how far the next one
 * is and which of the last days were recorded.
 *
 * The streak itself is kept by the server, so it follows the account from one
 * device to the next; folding a visit into it lives in the backend helper of
 * the same name. Everything here is pure so it can be tested.
 */

import { StreakRecord } from "../types/transactions";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** How many days the server keeps; the dialog reports on that window. */
export const STREAK_HISTORY_LENGTH = 30;

export type StreakTierKey = "dormant" | "spark" | "flame" | "blaze" | "vault";

export type StreakTier = {
    key: StreakTierKey;
    /** First day of a streak that lights this tier. */
    from: number;
};

/** The flame changes colour, speed and shape at each of these. */
export const STREAK_TIERS: StreakTier[] = [
    { key: "dormant", from: 0 },
    { key: "spark", from: 1 },
    { key: "flame", from: 10 },
    { key: "blaze", from: 50 },
    { key: "vault", from: 100 },
];

/** The days worth celebrating: every tier above the very first one. */
export const STREAK_MILESTONES = STREAK_TIERS.filter((tier) => tier.from > 1).map((tier) => tier.from);

/** The user's local calendar day as `YYYY-MM-DD`. */
export const toDayKey = (date: Date = new Date()) => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Day keys are compared as UTC midnights. Local timestamps would drift by an
 * hour twice a year and turn a kept streak into a broken one.
 */
const parseDayKey = (key: string) => {
    const [year, month, day] = (key || "").split("-").map(Number);
    if (!year || !month || !day) return null;

    const timestamp = Date.UTC(year, month - 1, day);
    return Number.isNaN(timestamp) ? null : timestamp;
};

const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
    const day = `${date.getUTCDate()}`.padStart(2, "0");

    return `${date.getUTCFullYear()}-${month}-${day}`;
};

export const shiftDayKey = (key: string, days: number) => {
    const base = parseDayKey(key);
    if (base === null) return key;

    return formatTimestamp(base + days * MILLISECONDS_PER_DAY);
};

export const getStreakTier = (current: number): StreakTier => {
    let match = STREAK_TIERS[0];
    for (const tier of STREAK_TIERS) {
        if (current >= tier.from) match = tier;
    }

    return match;
};

export type StreakGoal = {
    /** The next day count that lights a new flame. */
    target: number;
    daysLeft: number;
    /** How far along the way there, 0 to 1. */
    progress: number;
};

/** The milestone still ahead, or null once the last one is behind us. */
export const getStreakGoal = (current: number): StreakGoal | null => {
    const target = STREAK_MILESTONES.find((milestone) => current < milestone);
    if (!target) return null;

    return {
        target,
        daysLeft: target - current,
        progress: Math.min(Math.max(current / target, 0), 1),
    };
};

export type StreakDay = {
    key: string;
    visited: boolean;
    isToday: boolean;
};

/** The last `count` days ending today, oldest first, for the week strip. */
export const getRecentDays = (record: StreakRecord | null, todayKey: string = toDayKey(), count = 7): StreakDay[] => {
    const visited = new Set(record?.history ?? []);

    return Array.from({ length: count }, (_, index) => {
        const key = shiftDayKey(todayKey, index - (count - 1));
        return { key, visited: visited.has(key), isToday: key === todayKey };
    });
};
