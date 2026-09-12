import { type AssistantProviderId, DEFAULT_PROVIDER_ID, getProvider, isProviderId } from "./providers";

export const ASSISTANT_KEYS_STORAGE_KEY = "assistant-keys";
export const ASSISTANT_PROVIDER_STORAGE_KEY = "assistant-provider";
export const ASSISTANT_MODELS_STORAGE_KEY = "assistant-models";
export const ASSISTANT_MODEL_LIST_STORAGE_KEY = "assistant-model-list";
export const ASSISTANT_BASE_URL_STORAGE_KEY = "assistant-base-url";
export const ASSISTANT_CHAT_STORAGE_KEY = "assistant-chat";

export const ASSISTANT_KEY_EVENT = "finance:assistant-key";
export const ASSISTANT_OPEN_EVENT = "finance:open-assistant";

export const KEPT_MESSAGES = 40;

export type AssistantRole = "user" | "assistant";

export type AssistantMessage = {
    id: string;
    role: AssistantRole;
    content: string;
    failed?: boolean;
};

const announce = () => window.dispatchEvent(new Event(ASSISTANT_KEY_EVENT));

const readRecord = <T>(storageKey: string): Record<string, T> => {
    if (typeof window === "undefined") return {};

    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, T>) : {};
    } catch {
        return {};
    }
};

const writeRecord = <T>(storageKey: string, value: Record<string, T>) => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
};

export const readProviderId = (): AssistantProviderId => {
    if (typeof window === "undefined") return DEFAULT_PROVIDER_ID;

    try {
        const stored = localStorage.getItem(ASSISTANT_PROVIDER_STORAGE_KEY) || "";
        return isProviderId(stored) ? stored : DEFAULT_PROVIDER_ID;
    } catch {
        return DEFAULT_PROVIDER_ID;
    }
};

export const saveProviderId = (id: AssistantProviderId) => {
    try {
        localStorage.setItem(ASSISTANT_PROVIDER_STORAGE_KEY, id);
    } catch {}
    announce();
};

export const readKeys = (): Record<string, string> => readRecord<string>(ASSISTANT_KEYS_STORAGE_KEY);

export const readKey = (providerId: string): string | null => readKeys()[providerId] || null;

export const saveKey = (providerId: string, key: string) => {
    writeRecord(ASSISTANT_KEYS_STORAGE_KEY, { ...readKeys(), [providerId]: key.trim() });
    announce();
};

export const clearKey = (providerId: string) => {
    const keys = readKeys();
    delete keys[providerId];
    writeRecord(ASSISTANT_KEYS_STORAGE_KEY, keys);

    const lists = readRecord<string[]>(ASSISTANT_MODEL_LIST_STORAGE_KEY);
    delete lists[providerId];
    writeRecord(ASSISTANT_MODEL_LIST_STORAGE_KEY, lists);

    try {
        localStorage.removeItem(ASSISTANT_CHAT_STORAGE_KEY);
    } catch {}

    announce();
};

export const readModel = (providerId: string): string =>
    readRecord<string>(ASSISTANT_MODELS_STORAGE_KEY)[providerId] || getProvider(providerId).defaultModel;

export const saveModel = (providerId: string, model: string) => {
    writeRecord(ASSISTANT_MODELS_STORAGE_KEY, {
        ...readRecord<string>(ASSISTANT_MODELS_STORAGE_KEY),
        [providerId]: model.trim(),
    });
    announce();
};

export const readModelList = (providerId: string): string[] => {
    const list = readRecord<string[]>(ASSISTANT_MODEL_LIST_STORAGE_KEY)[providerId];
    return Array.isArray(list) ? list : [];
};

export const saveModelList = (providerId: string, models: string[]) => {
    writeRecord(ASSISTANT_MODEL_LIST_STORAGE_KEY, {
        ...readRecord<string[]>(ASSISTANT_MODEL_LIST_STORAGE_KEY),
        [providerId]: models,
    });
    announce();
};

export const readBaseUrl = (): string => {
    if (typeof window === "undefined") return "";

    try {
        return localStorage.getItem(ASSISTANT_BASE_URL_STORAGE_KEY) || "";
    } catch {
        return "";
    }
};

export const saveBaseUrl = (url: string) => {
    try {
        localStorage.setItem(ASSISTANT_BASE_URL_STORAGE_KEY, url.trim());
    } catch {}
    announce();
};

export const readAssistantChat = (): AssistantMessage[] => {
    if (typeof window === "undefined") return [];

    try {
        const raw = localStorage.getItem(ASSISTANT_CHAT_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (item): item is AssistantMessage =>
                typeof item?.id === "string" &&
                typeof item?.content === "string" &&
                (item.role === "user" || item.role === "assistant"),
        );
    } catch {
        return [];
    }
};

export const saveAssistantChat = (messages: AssistantMessage[]) => {
    try {
        localStorage.setItem(ASSISTANT_CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-KEPT_MESSAGES)));
    } catch {}
};
