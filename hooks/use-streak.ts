"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRecordStreakVisit } from "api/main";
import { toDayKey } from "lib/streak";
import useStore from "store/general";

export const useStreak = () => {
    const streak = useStore((state) => state.streak);
    const setStreak = useStore((state) => state.setStreak);

    const [reached, setReached] = useState<number | null>(null);
    const { mutateAsync: recordVisit } = useRecordStreakVisit();

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
