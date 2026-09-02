import assert from "node:assert/strict";
import test from "node:test";

import { getRecentDays, getStreakGoal, getStreakTier, shiftDayKey, toDayKey } from "../lib/streak";
import { StreakRecord } from "../types/transactions";

const record = (item: Partial<StreakRecord> & Pick<StreakRecord, "lastVisit" | "current">): StreakRecord => ({
    best: item.current,
    history: [item.lastVisit],
    celebrated: [],
    ...item,
});

test("lights a tier per streak length", () => {
    assert.equal(getStreakTier(0).key, "dormant");
    assert.equal(getStreakTier(9).key, "spark");
    assert.equal(getStreakTier(10).key, "flame");
    assert.equal(getStreakTier(49).key, "flame");
    assert.equal(getStreakTier(50).key, "blaze");
    assert.equal(getStreakTier(365).key, "vault");
});

test("points at the next milestone until the last one is behind", () => {
    assert.deepEqual(getStreakGoal(4), { target: 10, daysLeft: 6, progress: 0.4 });
    assert.equal(getStreakGoal(60)?.target, 100);
    assert.equal(getStreakGoal(100), null);
});

test("builds the week strip ending today", () => {
    const days = getRecentDays(
        record({ lastVisit: "2026-09-03", current: 2, history: ["2026-09-02", "2026-09-03"] }),
        "2026-09-03",
    );

    assert.equal(days.length, 7);
    assert.equal(days[0].key, "2026-08-28");
    assert.equal(days[6].isToday, true);
    assert.deepEqual(
        days.map((day) => day.visited),
        [false, false, false, false, false, true, true],
    );
});

test("shows an empty week when the account has no streak yet", () => {
    const days = getRecentDays(null, "2026-09-03");

    assert.equal(days.length, 7);
    assert.deepEqual(
        days.map((day) => day.visited),
        [false, false, false, false, false, false, false],
    );
});

test("reads today as a local calendar day", () => {
    assert.equal(toDayKey(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
    assert.equal(shiftDayKey("2026-03-01", -1), "2026-02-28");
});
