"use client";

import { useCallback, useEffect, useState } from "react";

import { type AssistantProvider, DEFAULT_PROVIDER_ID, getProvider } from "lib/assistant/providers";
import {
    ASSISTANT_KEY_EVENT,
    readBaseUrl,
    readKey,
    readModel,
    readModelList,
    readProviderId,
} from "lib/assistant/storage";

export type AssistantSettings = {
    provider: AssistantProvider;
    apiKey: string | null;
    model: string;
    baseURL: string;
    models: string[];
    connected: boolean;
    ready: boolean;
};

const read = (): Omit<AssistantSettings, "ready"> => {
    const providerId = readProviderId();
    const provider = getProvider(providerId);
    const baseURL = provider.id === "custom" ? readBaseUrl() : provider.baseURL || "";

    return {
        provider,
        apiKey: readKey(providerId),
        model: readModel(providerId),
        baseURL,
        models: readModelList(providerId),
        connected: Boolean(readKey(providerId)),
    };
};

export const useAssistantSettings = (): AssistantSettings => {
    const [state, setState] = useState<Omit<AssistantSettings, "ready">>(() => ({
        provider: getProvider(DEFAULT_PROVIDER_ID),
        apiKey: null,
        model: getProvider(DEFAULT_PROVIDER_ID).defaultModel,
        baseURL: "",
        models: [],
        connected: false,
    }));
    const [ready, setReady] = useState(false);

    const sync = useCallback(() => setState(read()), []);

    useEffect(() => {
        sync();
        setReady(true);

        window.addEventListener(ASSISTANT_KEY_EVENT, sync);
        window.addEventListener("storage", sync);

        return () => {
            window.removeEventListener(ASSISTANT_KEY_EVENT, sync);
            window.removeEventListener("storage", sync);
        };
    }, [sync]);

    return { ...state, ready };
};
