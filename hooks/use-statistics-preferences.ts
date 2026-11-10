"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CONNECTIONS_QUERY_KEY, putStatisticsPreferences, useConnections } from "api/connections";
import { ConnectionsResponse, StatisticsPreferences } from "types/transactions";

const STORAGE_KEY = "finance:statistics-preferences";

const EMPTY: StatisticsPreferences = { hiddenCategories: [], categoryLimits: {} };

const sanitize = (value: unknown): StatisticsPreferences => {
    const source = (value && typeof value === "object" ? value : {}) as Partial<StatisticsPreferences>;
    const hiddenCategories = Array.isArray(source.hiddenCategories)
        ? [...new Set(source.hiddenCategories.filter((item): item is string => typeof item === "string"))]
        : [];
    const categoryLimits = Object.fromEntries(
        Object.entries(source.categoryLimits && typeof source.categoryLimits === "object" ? source.categoryLimits : {})
            .map(([category, limit]): [string, number] => [category, Number(limit)])
            .filter(([, limit]) => Number.isFinite(limit) && limit > 0),
    );
    return { hiddenCategories, categoryLimits };
};

const isEmpty = (preferences: StatisticsPreferences) =>
    !preferences.hiddenCategories.length && !Object.keys(preferences.categoryLimits).length;

const readCache = (): StatisticsPreferences => {
    try {
        return sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
    } catch {
        return EMPTY;
    }
};

const writeCache = (preferences: StatisticsPreferences) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {}
};

export const useStatisticsPreferences = () => {
    const queryClient = useQueryClient();
    const { data } = useConnections();
    const [preferences, setPreferences] = useState<StatisticsPreferences>(EMPTY);
    const uploaded = useRef(false);

    useEffect(() => {
        setPreferences(readCache());
    }, []);

    useEffect(() => {
        if (!data) return;

        if (data.statistics) {
            const remote = sanitize(data.statistics);
            setPreferences(remote);
            writeCache(remote);
            return;
        }

        const local = readCache();
        if (data.statistics === null && !isEmpty(local) && !uploaded.current) {
            uploaded.current = true;
            putStatisticsPreferences(local).catch(() => undefined);
        }
    }, [data]);

    const save = useCallback(
        (next: StatisticsPreferences) => {
            const clean = sanitize(next);
            setPreferences(clean);
            writeCache(clean);
            queryClient.setQueryData<ConnectionsResponse>(CONNECTIONS_QUERY_KEY, (current) =>
                current && current.statistics !== undefined ? { ...current, statistics: clean } : current,
            );
            putStatisticsPreferences(clean).catch(() => undefined);
        },
        [queryClient],
    );

    const hidden = useMemo(() => new Set(preferences.hiddenCategories), [preferences.hiddenCategories]);

    const setHidden = useCallback(
        (hiddenCategories: string[]) => save({ ...preferences, hiddenCategories }),
        [preferences, save],
    );

    const toggle = useCallback(
        (category: string) =>
            setHidden(
                hidden.has(category)
                    ? preferences.hiddenCategories.filter((item) => item !== category)
                    : [...preferences.hiddenCategories, category],
            ),
        [hidden, preferences.hiddenCategories, setHidden],
    );

    const showOnly = useCallback(
        (category: string, all: string[]) => setHidden(all.filter((item) => item !== category)),
        [setHidden],
    );

    const setLimit = useCallback(
        (category: string, limit: number | null) => {
            const categoryLimits = { ...preferences.categoryLimits };
            if (limit && limit > 0) categoryLimits[category] = Math.round(limit * 100) / 100;
            else delete categoryLimits[category];
            save({ ...preferences, categoryLimits });
        },
        [preferences, save],
    );

    return {
        hidden,
        limits: preferences.categoryLimits,
        toggle,
        showOnly,
        showAll: () => setHidden([]),
        setHidden,
        setLimit,
    };
};
