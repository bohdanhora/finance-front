import { StreakRecord } from "../types/transactions";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const STREAK_HISTORY_LENGTH = 30;

export type StreakTierKey = "dormant" | "spark" | "flame" | "blaze" | "vault";

export type StreakTier = {
    key: StreakTierKey;
    from: number;
};

export const STREAK_TIERS: StreakTier[] = [
    { key: "dormant", from: 0 },
    { key: "spark", from: 1 },
    { key: "flame", from: 10 },
    { key: "blaze", from: 50 },
    { key: "vault", from: 100 },
];

export const STREAK_MILESTONES = STREAK_TIERS.filter((tier) => tier.from > 1).map((tier) => tier.from);

export const toDayKey = (date: Date = new Date()) => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
};

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
    target: number;
    daysLeft: number;
    progress: number;
};

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

export const getRecentDays = (record: StreakRecord | null, todayKey: string = toDayKey(), count = 7): StreakDay[] => {
    const visited = new Set(record?.history ?? []);

    return Array.from({ length: count }, (_, index) => {
        const key = shiftDayKey(todayKey, index - (count - 1));
        return { key, visited: visited.has(key), isToday: key === todayKey };
    });
};
