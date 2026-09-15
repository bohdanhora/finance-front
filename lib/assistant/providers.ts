export type AssistantProviderKind = "anthropic" | "openai";

export type AssistantProviderId = "anthropic" | "openai" | "xai" | "google" | "openrouter" | "custom";

export type AssistantProvider = {
    id: AssistantProviderId;
    kind: AssistantProviderKind;
    baseURL?: string;
    defaultModel: string;
    models: string[];
    keysUrl?: string;
    keyHint: string;
};

export const ASSISTANT_PROVIDERS: AssistantProvider[] = [
    {
        id: "anthropic",
        kind: "anthropic",
        defaultModel: "claude-opus-5",
        models: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5", "claude-fable-5-1", "claude-opus-4-8"],
        keysUrl: "https://console.anthropic.com/settings/keys",
        keyHint: "sk-ant-...",
    },
    {
        id: "openai",
        kind: "openai",
        baseURL: "https://api.openai.com/v1",
        defaultModel: "gpt-5",
        models: ["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o"],
        keysUrl: "https://platform.openai.com/api-keys",
        keyHint: "sk-...",
    },
    {
        id: "xai",
        kind: "openai",
        baseURL: "https://api.x.ai/v1",
        defaultModel: "grok-4",
        models: ["grok-4", "grok-4-fast", "grok-3", "grok-3-mini"],
        keysUrl: "https://console.x.ai/",
        keyHint: "xai-...",
    },
    {
        id: "google",
        kind: "openai",
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
        defaultModel: "gemini-2.5-pro",
        models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
        keysUrl: "https://aistudio.google.com/apikey",
        keyHint: "AIza...",
    },
    {
        id: "openrouter",
        kind: "openai",
        baseURL: "https://openrouter.ai/api/v1",
        defaultModel: "anthropic/claude-opus-4.5",
        models: ["anthropic/claude-opus-4.5", "openai/gpt-5", "x-ai/grok-4", "google/gemini-2.5-pro"],
        keysUrl: "https://openrouter.ai/keys",
        keyHint: "sk-or-...",
    },
    {
        id: "custom",
        kind: "openai",
        defaultModel: "",
        models: [],
        keyHint: "sk-...",
    },
];

export const DEFAULT_PROVIDER_ID: AssistantProviderId = "anthropic";

export const getProvider = (id: string): AssistantProvider =>
    ASSISTANT_PROVIDERS.find((provider) => provider.id === id) || ASSISTANT_PROVIDERS[0];

export const isProviderId = (value: string): value is AssistantProviderId =>
    ASSISTANT_PROVIDERS.some((provider) => provider.id === value);

export const ASSISTANT_FALLBACK_BETA = "server-side-fallback-2026-07-01";

export type AssistantErrorKind = "auth" | "rate" | "network" | "refusal" | "unknown";

const EFFORT_MODELS = [
    "claude-opus-5",
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-5",
    "claude-sonnet-4-6",
    "claude-fable-5",
    "claude-fable-5-1",
];

const FALLBACK_MODELS = ["claude-opus-5", "claude-fable-5", "claude-fable-5-1"];

export const supportsEffort = (model: string) => EFFORT_MODELS.includes(model);

export const supportsFallbacks = (model: string) => FALLBACK_MODELS.includes(model);

export const usableModels = (ids: string[], preferred: string[] = [], limit = 1000) => {
    const skipped = /embed|whisper|tts|dall-e|image|audio|moderation|rerank|vision-preview|realtime|search/i;

    const available = [...new Set(ids)].filter((id) => id && !skipped.test(id));
    const hoisted = preferred.filter((id) => available.includes(id));
    const rest = available.filter((id) => !hoisted.includes(id)).sort((a, b) => a.localeCompare(b));

    return [...hoisted, ...rest].slice(0, limit);
};
