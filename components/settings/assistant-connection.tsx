"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
    Check,
    ChevronDown,
    ExternalLink,
    Eye,
    EyeOff,
    Link2Off,
    Loader2,
    MessageCircle,
    RefreshCw,
    Search,
    Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";

import { useConnectionsActions } from "api/connections";
import { ConnectionCard, KeyField } from "components/settings/connection-card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { useAssistantSettings } from "hooks/use-assistant-settings";
import { ASSISTANT_PROVIDERS, type AssistantErrorKind, type AssistantProviderId } from "lib/assistant/providers";
import {
    ASSISTANT_OPEN_EVENT,
    clearKey,
    readAssistantPreferences,
    readStoredModel,
    saveBaseUrl,
    saveKey,
    saveModel,
    saveModelList,
    saveProviderId,
} from "lib/assistant/storage";

const StepLabel = ({ step, htmlFor, children }: { step: number; htmlFor: string; children: React.ReactNode }) => (
    <Label htmlFor={htmlFor} className="flex items-center gap-2 text-xs font-semibold">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[0.65rem] font-bold text-indigo-600 dark:text-indigo-300">
            {step}
        </span>
        {children}
    </Label>
);

const optionClass =
    "flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-indigo-500/10 focus-visible:bg-indigo-500/10";

const focusOption = (event: React.KeyboardEvent<HTMLElement>, target: Element | null | undefined) => {
    event.preventDefault();
    if (target instanceof HTMLElement) target.focus();
};

const ModelPicker = ({
    id,
    value,
    models,
    disabled,
    loading,
    placeholder,
    onChange,
}: {
    id: string;
    value: string;
    models: string[];
    disabled: boolean;
    loading: boolean;
    placeholder: string;
    onChange: (model: string) => void;
}) => {
    const t = useTranslations("assistant");
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const listRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    const query = search.trim();
    const filtered = models.filter((model) => model.toLowerCase().includes(query.toLowerCase()));
    const typed = query && !models.includes(query) ? query : "";

    const choose = (model: string) => {
        onChange(model);
        setOpen(false);
    };

    const moveBetweenOptions = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "ArrowDown") focusOption(event, event.currentTarget.nextElementSibling);
        if (event.key !== "ArrowUp") return;

        const previous = event.currentTarget.previousElementSibling;
        focusOption(event, previous || event.currentTarget.closest("[data-model-picker]")?.querySelector("input"));
    };

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) setSearch("");
            }}
        >
            <PopoverTrigger asChild>
                <button
                    id={id}
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    disabled={disabled}
                    className="flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 dark:border-gray-600 dark:bg-zinc-500/10 dark:focus-visible:border-blue-600"
                >
                    <span className={twMerge("min-w-0 truncate", !value && "text-muted-foreground")}>
                        {value || placeholder}
                    </span>
                    {loading ? (
                        <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                    ) : (
                        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                sideOffset={6}
                collisionPadding={12}
                data-model-picker
                className="bg-popover text-popover-foreground w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] rounded-xl p-1.5"
            >
                <div className="relative mb-1.5">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={200}
                        className="pl-9"
                        aria-label={t("modelSearch")}
                        placeholder={t("modelSearch")}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "ArrowDown") {
                                focusOption(event, listRef.current?.querySelector('[role="option"]'));
                            }
                            if (event.key === "Enter") {
                                event.preventDefault();
                                const next = filtered[0] || typed;
                                if (next) choose(next);
                            }
                        }}
                    />
                </div>

                <div
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-label={t("modelLabel")}
                    className="flex max-h-72 flex-col gap-0.5 overflow-y-auto overscroll-contain"
                >
                    {typed && (
                        <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            className={twMerge(optionClass, "font-medium text-indigo-600 dark:text-indigo-300")}
                            onClick={() => choose(typed)}
                            onKeyDown={moveBetweenOptions}
                        >
                            <span className="min-w-0 truncate">{t("useModel", { model: typed })}</span>
                        </button>
                    )}
                    {filtered.map((model) => (
                        <button
                            key={model}
                            type="button"
                            role="option"
                            aria-selected={value === model}
                            className={twMerge(optionClass, value === model && "font-medium")}
                            onClick={() => choose(model)}
                            onKeyDown={moveBetweenOptions}
                        >
                            <span className="min-w-0 truncate">{model}</span>
                            {value === model && <Check className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />}
                        </button>
                    ))}
                    {!typed && filtered.length === 0 && (
                        <p className="text-muted-foreground px-3 py-6 text-center text-sm">{t("noModels")}</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const AssistantConnection = () => {
    const t = useTranslations("assistant");
    const { provider, apiKey, model, models, baseURL, connected, ready } = useAssistantSettings();

    const [value, setValue] = useState("");
    const [url, setUrl] = useState("");
    const [visible, setVisible] = useState(false);
    const [checking, setChecking] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const autoLoaded = useRef<string | null>(null);
    const { saveAssistant } = useConnectionsActions();

    const offered = models.length > 0 ? models : provider.models;

    const pushPreferences = () => {
        void saveAssistant(readAssistantPreferences()).catch(() => {
            toast.error(t("syncFailed"));
        });
    };

    useEffect(() => setUrl(baseURL), [baseURL]);

    const describeError = (requestError: unknown) => {
        const kind = (requestError as { kind?: AssistantErrorKind })?.kind;
        return kind === "rate" || kind === "network" ? t(`errors.${kind}`) : t("invalidKey");
    };

    const pickDefault = (available: string[]) =>
        provider.defaultModel && available.includes(provider.defaultModel) ? provider.defaultModel : available[0];

    const fetchModels = async (key: string) => {
        const { listAssistantModels } = await import("api/assistant");

        return listAssistantModels({
            provider,
            apiKey: key,
            model: model || provider.defaultModel,
            baseURL: provider.id === "custom" ? url.trim() || baseURL : provider.baseURL,
        });
    };

    const reloadModels = async () => {
        if (!apiKey) return;

        setLoadingModels(true);
        setError(null);

        try {
            const available = await fetchModels(apiKey);
            saveModelList(provider.id, available);

            if (!model && available.length > 0) {
                saveModel(provider.id, pickDefault(available));
                pushPreferences();
            }
        } catch (requestError) {
            setError(describeError(requestError));
        } finally {
            setLoadingModels(false);
        }
    };

    useEffect(() => {
        if (!ready || !connected || models.length > 0 || autoLoaded.current === provider.id) return;

        autoLoaded.current = provider.id;
        void reloadModels();
    });

    const chooseProvider = (next: string) => {
        setError(null);
        setValue("");
        saveProviderId(next as AssistantProviderId);
        pushPreferences();
    };

    const commitBaseUrl = () => {
        if (url.trim() === baseURL) return;
        saveBaseUrl(url);
        pushPreferences();
    };

    const connect = async () => {
        const candidate = value.trim();

        if (!candidate) {
            setError(t("emptyKey"));
            return;
        }

        if (provider.id === "custom" && !url.trim()) {
            setError(t("emptyBaseUrl"));
            return;
        }

        setChecking(true);
        setError(null);

        try {
            const available = await fetchModels(candidate);

            if (provider.id === "custom") saveBaseUrl(url);
            autoLoaded.current = provider.id;
            saveKey(provider.id, candidate);
            saveModelList(provider.id, available);

            if (available.length > 0 && !available.includes(model) && !readStoredModel(provider.id)) {
                saveModel(provider.id, pickDefault(available));
            }
            pushPreferences();

            setValue("");
            toast.success(t("connectedToast"));
        } catch (requestError) {
            setError(describeError(requestError));
        } finally {
            setChecking(false);
        }
    };

    const disconnect = () => {
        clearKey(provider.id);
        autoLoaded.current = null;
        setError(null);
        toast.success(t("disconnectedToast"));
    };

    const openChat = () => window.dispatchEvent(new Event(ASSISTANT_OPEN_EVENT));

    const maskedKey = apiKey && apiKey.length > 14 ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : "••••••••";

    return (
        <ConnectionCard
            mark={
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-sm">
                    <Sparkles className="size-5" />
                </span>
            }
            title={t("title")}
            status={connected ? t("connectedAs", { model: model || t("modelPlaceholder") }) : t("notLinked")}
            connected={connected}
            connectedLabel={t("connected")}
            note={t("storedLocally")}
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <StepLabel step={1} htmlFor="assistant-provider">
                        {t("providerLabel")}
                    </StepLabel>
                    <Select value={provider.id} onValueChange={chooseProvider}>
                        <SelectTrigger id="assistant-provider" className="h-11 w-full min-w-0">
                            <SelectValue>
                                <span className="min-w-0 truncate">{t(`providers.${provider.id}`)}</span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                            {ASSISTANT_PROVIDERS.map((option) => (
                                <SelectItem key={option.id} value={option.id} className="min-h-11">
                                    <span className="text-sm font-medium">{t(`providers.${option.id}`)}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {provider.id === "custom" && (
                        <div className="mt-2 flex flex-col gap-2">
                            <Label htmlFor="assistant-base-url" className="text-xs font-semibold">
                                {t("baseUrlLabel")}
                            </Label>
                            <Input
                                id="assistant-base-url"
                                inputMode="url"
                                spellCheck={false}
                                placeholder="https://api.example.com/v1"
                                value={url}
                                onChange={(event) => setUrl(event.target.value)}
                                onBlur={commitBaseUrl}
                            />
                            <p className="text-muted-foreground text-xs leading-relaxed">{t("baseUrlHint")}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <StepLabel step={2} htmlFor="assistant-key">
                        {t("keyLabel")}
                    </StepLabel>

                    {connected ? (
                        <KeyField>
                            <Input
                                id="assistant-key"
                                readOnly
                                value={maskedKey}
                                className="text-muted-foreground flex-1 font-mono"
                            />
                            <Button variant="secondary" onClick={disconnect}>
                                <Link2Off />
                                {t("disconnect")}
                            </Button>
                        </KeyField>
                    ) : (
                        <>
                            <KeyField>
                                <div className="relative flex-1">
                                    <Input
                                        id="assistant-key"
                                        name="assistant-key"
                                        type={visible ? "text" : "password"}
                                        autoComplete="new-password"
                                        data-1p-ignore
                                        data-lpignore="true"
                                        spellCheck={false}
                                        className="pr-10"
                                        placeholder={provider.keyHint}
                                        value={value}
                                        disabled={checking}
                                        onChange={(event) => setValue(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") void connect();
                                        }}
                                    />
                                    <button
                                        type="button"
                                        aria-label={visible ? t("hideKey") : t("showKey")}
                                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                                        onClick={() => setVisible((current) => !current)}
                                    >
                                        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <Button disabled={checking} onClick={() => void connect()}>
                                    {checking && <Loader2 className="animate-spin" />}
                                    {checking ? t("checking") : t("connect")}
                                </Button>
                            </KeyField>

                            {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                            {provider.keysUrl && (
                                <a
                                    href={provider.keysUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex w-fit items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    {t("getKey")}
                                    <ExternalLink className="size-3.5" />
                                </a>
                            )}
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <StepLabel step={3} htmlFor="assistant-model">
                            {t("modelLabel")}
                        </StepLabel>
                        {connected && (
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                {models.length > 0 && <span>{t("modelsCount", { count: models.length })}</span>}
                                <button
                                    type="button"
                                    disabled={loadingModels}
                                    className="hover:text-foreground flex cursor-pointer items-center gap-1.5 font-medium disabled:cursor-default disabled:opacity-60"
                                    onClick={() => void reloadModels()}
                                >
                                    <RefreshCw className={twMerge("size-3.5", loadingModels && "animate-spin")} />
                                    {t("reloadModels")}
                                </button>
                            </div>
                        )}
                    </div>

                    <ModelPicker
                        id="assistant-model"
                        value={connected ? model : ""}
                        models={offered}
                        disabled={!connected}
                        loading={loadingModels}
                        placeholder={connected ? t("modelPlaceholder") : t("modelLocked")}
                        onChange={(next) => {
                            saveModel(provider.id, next);
                            pushPreferences();
                        }}
                    />

                    {connected && error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                    <p className="text-muted-foreground text-xs leading-relaxed">{t("modelHint")}</p>
                </div>

                {connected && (
                    <Button onClick={openChat}>
                        <MessageCircle />
                        {t("openChat")}
                    </Button>
                )}
            </div>
        </ConnectionCard>
    );
};
