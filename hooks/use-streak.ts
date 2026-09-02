"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";

import { StreakRecord, parseStreak, registerVisit, toDayKey } from "lib/streak";

/** One record per account, so two people on one browser keep their own flame. */
const storageKey = () => `financeStreak:${Cookies.get("userId") || "local"}`;

/**
 * Records that the app has been opened today and hands back the streak.
 *
 * The visit is written on mount and re-checked whenever the tab comes back to
 * the front, which is what rolls the number over for a tab left open overnight.
 */
export const useStreak = () => {
    const [record, setRecord] = useState<StreakRecord | null>(null);
    const [reached, setReached] = useState<number | null>(null);

    const sync = useCallback(() => {
        const key = storageKey();

        let stored: StreakRecord | null = null;
        try {
            stored = parseStreak(localStorage.getItem(key));
        } catch {
            // Private mode or blocked storage: the streak simply starts again.
        }

        const visit = registerVisit(stored, toDayKey());
        setRecord(visit.record);

        if (visit.reached) setReached(visit.reached);

        if (visit.isNewDay) {
            try {
                localStorage.setItem(key, JSON.stringify(visit.record));
            } catch {
                // Nothing to do; the badge still shows the run for this session.
            }
        }
    }, []);

    useEffect(() => {
        sync();

        const onVisible = () => {
            if (document.visibilityState === "visible") sync();
        };

        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [sync]);

    const clearMilestone = useCallback(() => setReached(null), []);

    return { record, reached, clearMilestone };
};
