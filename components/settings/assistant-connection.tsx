"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Eye, EyeOff, Link2Off, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

import { ConnectionCard, KeyField } from "components/settings/connection-card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { useAssistantSettings } from "hooks/use-assistant-settings";
import { ASSISTANT_PROVIDERS, type AssistantErrorKind, type AssistantProviderId } from "lib/assistant/providers";
import {
    ASSISTANT_OPEN_EVENT,
    clearKey,
    saveBaseUrl,
    saveKey,
    saveModel,
    saveModelList,
    saveProviderId,
} from "lib/assistant/storage";

const CUSTOM_MODEL = "custom";

export const AssistantConnection = ({ opened, onNavigate }: { opened: boolean; onNavigate: () => void }) => {
    const t = useTranslations("assistant");
    const { provider, model, models, baseURL, connected } = useAssistantSettings();

    const [value, setValue] = useState("");
    const [url, setUrl] = useState("");
    const [visible, setVisible] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [custom, setCustom] = useState(false);
    const [customValue, setCustomValue] = useState("");

    const offered = models.length > 0 ? models : provider.models;
    const listed = offered.includes(model);
    const triggerLabel = custom ? customValue.trim() || t("customModel") : model || t("modelPlaceholder");

    useEffect(() => {
        if (!opened) return;

        setValue("");
        setUrl(baseURL);
        setVisible(false);
        setError(null);
        setCustom(Boolean(model) && !listed);
        setCustomValue(listed ? "" : model);
    }, [opened, baseURL, model, listed]);

    const chooseProvider = (next: string) => {
        setError(null);
        setValue("");
        saveProviderId(next as AssistantProviderId);
    };

    const chooseModel = (next: string) => {
        if (next === CUSTOM_MODEL) {
            setCustom(true);
            setCustomValue(listed ? "" : model);
            return;
        }

        setCustom(false);
        saveModel(provider.id, next);
    };

    const commitCustomModel = () => {
        const next = customValue.trim();
        if (!next || next === model) return;

        saveModel(provider.id, next);
    };

    const commitBaseUrl = () => {
        if (url.trim() === baseURL) return;
        saveBaseUrl(url);
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
            const { listAssistantModels } = await import("api/assistant");

            const endpoint = provider.id === "custom" ? url.trim() : provider.baseURL;
            const available = await listAssistantModels({
                provider,
                apiKey: candidate,
                model: model || provider.defaultModel,
                baseURL: endpoint,
            });

            if (provider.id === "custom") saveBaseUrl(url);
            saveKey(provider.id, candidate);
            saveModelList(provider.id, available);

            if (available.length > 0 && !available.includes(model)) {
                saveModel(
                    provider.id,
                    provider.defaultModel && available.includes(provider.defaultModel)
                        ? provider.defaultModel
                        : available[0],
                );
            }

            setValue("");
            toast.success(t("connectedToast"));
        } catch (requestError) {
            const kind = (requestError as { kind?: AssistantErrorKind })?.kind;
            setError(kind === "rate" || kind === "network" ? t(`errors.${kind}`) : t("invalidKey"));
        } finally {
            setChecking(false);
        }
    };

    const disconnect = () => {
        clearKey(provider.id);
        setError(null);
        toast.success(t("disconnectedToast"));
    };

    const openChat = () => {
        onNavigate();
        window.dispatchEvent(new Event(ASSISTANT_OPEN_EVENT));
    };

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
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="assistant-provider" className="text-xs font-semibold">
                        {t("providerLabel")}
                    </Label>
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
                </div>

                {provider.id === "custom" && (
                    <div className="flex flex-col gap-2">
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

                {connected ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button className="sm:flex-1" onClick={openChat}>
                            <MessageCircle />
                            {t("openChat")}
                        </Button>
                        <Button variant="secondary" onClick={disconnect}>
                            <Link2Off />
                            {t("disconnect")}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <Label htmlFor="assistant-key" className="text-xs font-semibold">
                            {t("keyLabel")}
                        </Label>
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
                    </div>
                )}

                <div className="border-border/70 flex flex-col gap-2 border-t pt-4">
                    <Label htmlFor="assistant-model" className="text-xs font-semibold">
                        {t("modelLabel")}
                    </Label>
                    <Select value={custom ? CUSTOM_MODEL : model} onValueChange={chooseModel}>
                        <SelectTrigger id="assistant-model" className="h-11 w-full min-w-0">
                            <SelectValue>
                                <span className="min-w-0 truncate">{triggerLabel}</span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                            {offered.map((option) => (
                                <SelectItem key={option} value={option} className="min-h-11">
                                    <span className="text-sm">{option}</span>
                                </SelectItem>
                            ))}
                            <SelectItem value={CUSTOM_MODEL} className="min-h-11">
                                <span className="text-sm font-medium">{t("customModel")}</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {custom && (
                        <Input
                            spellCheck={false}
                            placeholder={provider.defaultModel || "model-id"}
                            value={customValue}
                            onChange={(event) => setCustomValue(event.target.value)}
                            onBlur={commitCustomModel}
                            onKeyDown={(event) => {
                                if (event.key !== "Enter") return;
                                event.preventDefault();
                                commitCustomModel();
                            }}
                        />
                    )}

                    <p className="text-muted-foreground text-xs leading-relaxed">
                        {models.length > 0 ? t("modelHintLive") : t("modelHint")}
                    </p>
                </div>
            </div>
        </ConnectionCard>
    );
};
