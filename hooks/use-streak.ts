"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRecordStreakVisit } from "api/main";
import { toDayKey } from "lib/streak";
import useStore from "store/general";

/**
 * Records that the app has been opened today and hands back the streak.
 *
 * The record lives on the server, so the same run continues on a phone and a
 * laptop. `all-info` already carries it, which is what the badge draws first;
 * this only reports the visit and swaps in the answer. The call is idempotent
 * per day, and is repeated when the tab comes back to the front so a tab left
 * open overnight rolls over.
 */
export const useStreak = () => {
    const streak = useStore((state) => state.streak);
    const setStreak = useStore((state) => state.setStreak);

    const [reached, setReached] = useState<number | null>(null);
    const { mutateAsync: recordVisit } = useRecordStreakVisit();

    // One request per day per tab. Without it every return to the tab would
    // send another one, and React's strict mode would double the first.
    const reportedDay = useRef<string | null>(null);

    const sync = useCallback(async () => {
        const day = toDayKey();
        if (reportedDay.current === day) return;
        reportedDay.current = day;

        try {
            const result = await recordVisit({ day });
            setStreak(result.streak);
            if (result.reached) setReached(result.reached);
        } catch {
            // Offline or a failed request: the badge keeps showing whatever
            // `all-info` brought, and the visit is reported on the next load.
            reportedDay.current = null;
        }
    }, [recordVisit, setStreak]);

    useEffect(() => {
        void sync();

        const onVisible = () => {
            if (document.visibilityState === "visible") void sync();
        };

        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [sync]);

    const clearMilestone = useCallback(() => setReached(null), []);

    return { record: streak, reached, clearMilestone };
};
