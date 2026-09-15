"use client";

import { useEffect, useState } from "react";

import { fetchStatement, isPeriodRejected, isRateLimited, statementCooldownLeft } from "api/monobank";
import {
    applyHistoryWindow,
    EMPTY_MONOBANK_HISTORY,
    type MonobankHistory,
    nextHistoryWindow,
    readMonobankHistory,
    saveMonobankHistory,
} from "lib/monobank";

type HistoryState = {
    key: string | null;
    now: number;
    history: MonobankHistory;
};

const RETRY_BUFFER_MS = 1000;

export const useMonobankHistory = (token: string | null, accountId: string | null, enabled: boolean) => {
    const key = token && accountId ? `${token.slice(-6)}:${accountId}` : null;

    const [state, setState] = useState<HistoryState>({ key: null, now: 0, history: EMPTY_MONOBANK_HISTORY });
    const [error, setError] = useState<unknown>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setError(null);
        setState({
            key,
            now: Math.floor(Date.now() / 1000),
            history: token && accountId ? readMonobankHistory(token, accountId) : EMPTY_MONOBANK_HISTORY,
        });
    }, [key, token, accountId]);

    const current = state.key === key ? state.history : EMPTY_MONOBANK_HISTORY;
    const pending = state.key === key ? nextHistoryWindow(current, state.now) : null;

    useEffect(() => {
        if (!enabled || !token || !accountId || error || state.key !== key) return;

        const window = nextHistoryWindow(state.history, state.now);
        if (!window) return;

        let cancelled = false;
        const left = statementCooldownLeft();

        const timer = setTimeout(
            async () => {
                try {
                    const items = await fetchStatement(token, accountId, window.from, window.to);
                    if (cancelled) return;

                    setState((previous) => {
                        if (previous.key !== key) return previous;

                        const history = applyHistoryWindow(previous.history, window, items);
                        saveMonobankHistory(token, accountId, history);
                        return { ...previous, history };
                    });
                } catch (requestError) {
                    if (cancelled) return;

                    if (isRateLimited(requestError)) {
                        setAttempt((count) => count + 1);
                        return;
                    }

                    if (isPeriodRejected(requestError)) {
                        setState((previous) => {
                            if (previous.key !== key) return previous;

                            const history = { ...previous.history, gap: null, complete: true };
                            saveMonobankHistory(token, accountId, history);
                            return { ...previous, history };
                        });
                        return;
                    }

                    setError(requestError);
                }
            },
            left > 0 ? left + RETRY_BUFFER_MS : 0,
        );

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [enabled, token, accountId, key, state, error, attempt]);

    return {
        items: current.items,
        from: current.from,
        complete: current.complete && !current.gap,
        loading: enabled && Boolean(key) && !error && pending !== null,
        error,
    };
};
