"use client";

import { useEffect } from "react";

import { putAssistantPreferences, putMonobankToken, useConnections } from "api/connections";
import { applyAssistantPreferences, hasAssistantPreferences, readAssistantPreferences } from "lib/assistant/storage";
import { clearMonobankToken, readMonobankToken, saveMonobankToken } from "lib/monobank";

const CONNECTIONS_SYNCED_STORAGE_KEY = "connections-synced";

const readSynced = () => {
    try {
        return localStorage.getItem(CONNECTIONS_SYNCED_STORAGE_KEY) === "1";
    } catch {
        return false;
    }
};

const markSynced = () => {
    try {
        localStorage.setItem(CONNECTIONS_SYNCED_STORAGE_KEY, "1");
    } catch {}
};

export const useConnectionsSync = () => {
    const { data } = useConnections();

    useEffect(() => {
        if (!data) return;

        const firstSync = !readSynced();
        const localToken = readMonobankToken();
        const uploads: Promise<void>[] = [];

        if (data.monobankToken) {
            if (data.monobankToken !== localToken) saveMonobankToken(data.monobankToken);
        } else if (localToken) {
            if (firstSync) uploads.push(putMonobankToken(localToken));
            else clearMonobankToken();
        }

        if (data.assistant) {
            applyAssistantPreferences(data.assistant);
        } else if (firstSync && hasAssistantPreferences()) {
            uploads.push(putAssistantPreferences(readAssistantPreferences()));
        }

        Promise.all(uploads).then(markSynced, () => undefined);
    }, [data]);
};
