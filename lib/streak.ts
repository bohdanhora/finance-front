/**
 * The daily visit streak: how many days in a row the app has been opened.
 *
 * Everything here is pure so the day maths can be tested. Reading and writing
 * the record lives in `hooks/use-streak.ts`.
 */

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** How many days of history are kept; the dialog shows the last seven. */
export const STREAK_HISTORY_LENGTH = 30;

export type StreakRecord = {
    /** Local calendar day of the last recorded visit, `YYYY-MM-DD`. */
    lastVisit: string;
    /** Days in a row up to and including `lastVisit`. */
    current: number;
    /** The longest run this account has ever put together. */
    best: number;
    /** Recorded days, oldest first, trimmed to `STREAK_HISTORY_LENGTH`. */
    history: string[];
    /** Milestones already announced, so a toast never repeats. */
    celebrated: number[];
};

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

/** Whole days from one key to another, or null when either one is unusable. */
export const daysBetween = (from: string, to: string) => {
    const start = parseDayKey(from);
    const end = parseDayKey(to);
    if (start === null || end === null) return null;

    return Math.round((end - start) / MILLISECONDS_PER_DAY);
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

export type StreakVisit = {
    record: StreakRecord;
    /** True when this is the first visit of a new day, so it has to be saved. */
    isNewDay: boolean;
    /** The milestone this visit reached, when it deserves an announcement. */
    reached: number | null;
};

const startRecord = (todayKey: string): StreakRecord => ({
    lastVisit: todayKey,
    current: 1,
    best: 1,
    history: [todayKey],
    celebrated: [],
});

/**
 * Fold today's visit into the stored record: one more day continues the run,
 * a longer gap starts it again, and the same day changes nothing.
 */
export const registerVisit = (stored: StreakRecord | null, todayKey: string = toDayKey()): StreakVisit => {
    if (!stored) return { record: startRecord(todayKey), isNewDay: true, reached: null };

    const gap = daysBetween(stored.lastVisit, todayKey);

    // A gap of zero is the same day. A negative one means the device clock moved
    // backwards (a flight, a manual change), and burning the streak over that
    // would punish the user for their phone, so the record is left alone.
    if (gap === null || gap <= 0) return { record: stored, isNewDay: false, reached: null };

    const current = gap === 1 ? stored.current + 1 : 1;

    // A broken streak drops the milestones above the new count, so climbing back
    // to ten days is announced again.
    const celebrated = stored.celebrated.filter((milestone) => milestone <= current);
    const reached = STREAK_MILESTONES.includes(current) && !celebrated.includes(current) ? current : null;

    return {
        record: {
            lastVisit: todayKey,
            current,
            best: Math.max(stored.best, current),
            history: [...stored.history, todayKey].slice(-STREAK_HISTORY_LENGTH),
            celebrated: reached ? [...celebrated, reached] : celebrated,
        },
        isNewDay: true,
        reached,
    };
};

/** Anything stored by an older version, or by hand, has to survive being read. */
export const parseStreak = (raw: string | null): StreakRecord | null => {
    if (!raw) return null;

    let parsed: Partial<StreakRecord>;
    try {
        parsed = JSON.parse(raw) as Partial<StreakRecord>;
    } catch {
        return null;
    }

    if (!parsed || typeof parsed.lastVisit !== "string" || parseDayKey(parsed.lastVisit) === null) return null;

    const current = Math.max(Math.floor(Number(parsed.current)) || 1, 1);
    const history = Array.isArray(parsed.history)
        ? parsed.history.filter((day): day is string => typeof day === "string" && parseDayKey(day) !== null)
        : [];

    return {
        lastVisit: parsed.lastVisit,
        current,
        best: Math.max(Math.floor(Number(parsed.best)) || 1, current),
        history: (history.length ? history : [parsed.lastVisit]).slice(-STREAK_HISTORY_LENGTH),
        celebrated: Array.isArray(parsed.celebrated)
            ? parsed.celebrated.filter((day): day is number => typeof day === "number")
            : [],
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
