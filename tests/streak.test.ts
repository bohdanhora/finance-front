import assert from "node:assert/strict";
import test from "node:test";

import {
    StreakRecord,
    getRecentDays,
    getStreakGoal,
    getStreakTier,
    parseStreak,
    registerVisit,
    shiftDayKey,
    toDayKey,
} from "../lib/streak";

const record = (item: Partial<StreakRecord> & Pick<StreakRecord, "lastVisit" | "current">): StreakRecord => ({
    best: item.current,
    history: [item.lastVisit],
    celebrated: [],
    ...item,
});

test("starts a streak on the very first visit", () => {
    const { record: started, isNewDay, reached } = registerVisit(null, "2026-09-03");

    assert.equal(started.current, 1);
    assert.equal(started.best, 1);
    assert.deepEqual(started.history, ["2026-09-03"]);
    assert.equal(isNewDay, true);
    assert.equal(reached, null);
});

test("counts yesterday as a continued day and today as no change", () => {
    const yesterday = registerVisit(record({ lastVisit: "2026-09-02", current: 4 }), "2026-09-03");
    assert.equal(yesterday.record.current, 5);
    assert.equal(yesterday.isNewDay, true);

    const again = registerVisit(yesterday.record, "2026-09-03");
    assert.equal(again.record.current, 5);
    assert.equal(again.isNewDay, false);
});

test("restarts after a missed day but keeps the best run", () => {
    const { record: broken } = registerVisit(record({ lastVisit: "2026-08-30", current: 12, best: 12 }), "2026-09-03");

    assert.equal(broken.current, 1);
    assert.equal(broken.best, 12);
});

test("leaves the record alone when the device clock moves backwards", () => {
    const stored = record({ lastVisit: "2026-09-03", current: 9 });
    const { record: same, isNewDay } = registerVisit(stored, "2026-09-01");

    assert.equal(same, stored);
    assert.equal(isNewDay, false);
});

test("announces a milestone once, and again after the streak is rebuilt", () => {
    const first = registerVisit(record({ lastVisit: "2026-09-02", current: 9 }), "2026-09-03");
    assert.equal(first.reached, 10);
    assert.deepEqual(first.record.celebrated, [10]);

    const next = registerVisit(first.record, "2026-09-04");
    assert.equal(next.reached, null);

    const restarted = registerVisit(next.record, "2026-09-20");
    assert.deepEqual(restarted.record.celebrated, []);

    const rebuilt = registerVisit(record({ lastVisit: "2026-09-02", current: 9, celebrated: [10, 50] }), "2026-09-03");
    assert.equal(rebuilt.reached, null);
});

test("keeps the history to a month and drops the oldest days", () => {
    const history = Array.from({ length: 30 }, (_, index) => shiftDayKey("2026-09-02", index - 29));
    const { record: rolled } = registerVisit(
        record({ lastVisit: "2026-09-02", current: 30, best: 30, history }),
        "2026-09-03",
    );

    assert.equal(rolled.history.length, 30);
    assert.equal(rolled.history[0], "2026-08-05");
    assert.equal(rolled.history[29], "2026-09-03");
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

test("reads a stored record and refuses a broken one", () => {
    const stored = parseStreak('{"lastVisit":"2026-09-03","current":7,"best":3,"history":["x","2026-09-03"]}');

    assert.equal(stored?.current, 7);
    assert.equal(stored?.best, 7, "a best run can never be shorter than the current one");
    assert.deepEqual(stored?.history, ["2026-09-03"], "unparsable days are dropped");
    assert.deepEqual(stored?.celebrated, []);

    assert.equal(parseStreak(null), null);
    assert.equal(parseStreak("not json"), null);
    assert.equal(parseStreak('{"current":4}'), null);
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

test("reads today as a local calendar day", () => {
    assert.equal(toDayKey(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
    assert.equal(shiftDayKey("2026-03-01", -1), "2026-02-28");
});
