"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Eraser, Mic, Sparkles, Square, X } from "lucide-react";
import { twMerge } from "lib/tw";

import { Button } from "components/ui/button";
import { useAssistantSettings } from "hooks/use-assistant-settings";
import { useIsMobile } from "hooks/use-is-mobile";
import { buildInstructions } from "lib/assistant/prompt";
import { ASSISTANT_OPEN_EVENT, AssistantMessage, readAssistantChat, saveAssistantChat } from "lib/assistant/storage";
import { useAccountSnapshot } from "./use-account-snapshot";
import { useSpeechInput } from "hooks/use-speech-input";
import { Hint } from "components/hint";

const SUGGESTION_KEYS = ["spending", "saving", "bills", "afford"] as const;

export const AssistantChat = () => {
    const t = useTranslations("assistant");
    const locale = useLocale();
    const isMobile = useIsMobile();
    const { provider, apiKey, model, baseURL, connected } = useAssistantSettings();
    const buildSnapshot = useAccountSnapshot();

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const speech = useSpeechInput({ locale, onText: setDraft });

    useEffect(() => {
        setMessages(readAssistantChat());
    }, []);

    useEffect(() => {
        const openChat = () => setOpen(true);
        window.addEventListener(ASSISTANT_OPEN_EVENT, openChat);

        return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, openChat);
    }, []);

    useEffect(() => {
        if (!open) return;
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [messages, open]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const persist = useCallback((next: AssistantMessage[]) => {
        saveAssistantChat(next);
        return next;
    }, []);

    const send = async (text: string) => {
        const question = text.trim();
        if (!question || streaming || !apiKey || !model) return;
        if (speech.listening) speech.stop();

        const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: question }];
        const replyId = crypto.randomUUID();

        setDraft("");
        setError(null);
        setStreaming(true);
        setMessages(persist([...history, { id: replyId, role: "assistant", content: "" }]));

        const controller = new AbortController();
        abortRef.current = controller;

        const showReply = (content: string) =>
            setMessages((current) =>
                persist(current.map((message) => (message.id === replyId ? { ...message, content } : message))),
            );

        try {
            const { streamAssistantReply } = await import("api/assistant");

            const { snapshot, tools } = buildSnapshot();

            await streamAssistantReply({
                connection: { provider, apiKey, model, baseURL: baseURL || undefined },
                instructions: buildInstructions(locale),
                noToolsInstructions: buildInstructions(locale, false),
                snapshot,
                tools,
                messages: history,
                signal: controller.signal,
                onText: showReply,
                onWorking: setWorking,
            });
        } catch (requestError) {
            const kind = (requestError as { kind?: string })?.kind ?? "unknown";
            setError(t(`errors.${kind}`));
            setMessages((current) =>
                persist(
                    current.map((message) =>
                        message.id === replyId && !message.content ? { ...message, failed: true } : message,
                    ),
                ),
            );
        } finally {
            abortRef.current = null;
            setWorking(false);
            setStreaming(false);
        }
    };

    const stop = () => abortRef.current?.abort();

    const reset = () => {
        stop();
        setError(null);
        setMessages(persist([]));
    };

    if (!connected) return null;

    const visible = messages.filter((message) => !message.failed);

    const toggleVoice = () => {
        if (speech.listening) {
            speech.stop();
            inputRef.current?.focus();
            return;
        }
        speech.start(draft);
    };

    return (
        <>
            <button
                type="button"
                aria-label={t("open")}
                title={t("open")}
                onClick={() => setOpen((current) => !current)}
                className={twMerge(
                    "bottom-safe bg-accent text-on-accent shadow-glow fixed right-4 z-40 flex size-12 items-center justify-center rounded-full transition-[opacity,transform] hover:scale-105",
                    "sm:right-6 sm:bottom-6",
                    open && "opacity-0",
                )}
            >
                <Sparkles className="size-5" />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label={t("title")}
                    className={twMerge(
                        "chat-panel bg-surface border-rule-strong fixed z-50 flex flex-col overflow-hidden border shadow-2xl sm:rounded-3xl",
                    )}
                >
                    <header className="border-rule flex items-center gap-2 border-b px-4 py-3">
                        <span className="bg-accent-wash text-accent flex size-9 shrink-0 items-center justify-center rounded-xl">
                            <Sparkles className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="font-display truncate text-sm font-medium">{t("title")}</p>
                            <p className="label truncate">{t("subtitle")}</p>
                        </div>
                        {visible.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("newChat")}
                                title={t("newChat")}
                                onClick={reset}
                            >
                                <Eraser />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label={t("close")} onClick={() => setOpen(false)}>
                            <X />
                        </Button>
                    </header>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
                        {visible.length === 0 ? (
                            <div className="flex flex-col gap-3 py-6">
                                <p className="font-display text-base font-medium">{t("emptyTitle")}</p>
                                <p className="text-ink-faint text-sm leading-relaxed">{t("emptyHint")}</p>
                                <div className="flex flex-col gap-2 pt-2">
                                    {SUGGESTION_KEYS.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => void send(t(`suggestions.${suggestion}`))}
                                            className="border-rule hover:border-accent hover:text-accent rounded-xl border px-3 py-2.5 text-left text-sm transition-colors"
                                        >
                                            {t(`suggestions.${suggestion}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            visible.map((message) => {
                                const mine = message.role === "user";
                                const pending = !mine && !message.content && streaming;

                                return (
                                    <div
                                        key={message.id}
                                        className={twMerge("flex", mine ? "justify-end" : "justify-start")}
                                    >
                                        <div
                                            className={twMerge(
                                                "max-w-5/6 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                                                mine
                                                    ? "bg-accent text-on-accent rounded-br-md"
                                                    : "bg-wash rounded-bl-md",
                                            )}
                                        >
                                            {pending ? (
                                                <span className="text-ink-faint flex items-center gap-1.5">
                                                    {working && t("working")}
                                                    <span className="caret caret-blink" />
                                                </span>
                                            ) : (
                                                message.content
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {error && <p className="border-signal text-signal border-l-2 py-1 pl-3 text-sm">{error}</p>}
                    </div>

                    <div className="border-rule border-t p-3">
                        {speech.listening && (
                            <p className="text-signal mb-2 flex items-center gap-2 px-1 text-xs">
                                <span className="bg-signal size-2 animate-pulse rounded-full" />
                                {t("voice.listening")}
                            </p>
                        )}
                        {speech.error && !speech.listening && (
                            <p className="text-ink-muted mb-2 px-1 text-xs">{t(`voice.errors.${speech.error}`)}</p>
                        )}
                        <div
                            className={twMerge(
                                "border-rule bg-surface focus-within:border-accent flex items-end gap-2 border px-3 py-2 transition-colors",
                                speech.listening && "border-signal focus-within:border-signal",
                            )}
                        >
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={draft}
                                enterKeyHint="send"
                                placeholder={speech.listening ? t("voice.speak") : t("placeholder")}
                                onChange={(event) => {
                                    if (speech.listening) speech.stop();
                                    setDraft(event.target.value);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key !== "Enter" || event.shiftKey || isMobile) return;
                                    event.preventDefault();
                                    void send(draft);
                                }}
                                className="placeholder:text-ink-faint field-sizing-content max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base outline-none md:text-sm"
                            />
                            {speech.supported && !streaming && (
                                <Button
                                    size="icon"
                                    variant={speech.listening ? "destructive" : "ghost"}
                                    className={twMerge("size-9 shrink-0", speech.listening && "animate-pulse")}
                                    aria-label={speech.listening ? t("voice.stop") : t("voice.start")}
                                    title={speech.listening ? t("voice.stop") : t("voice.start")}
                                    aria-pressed={speech.listening}
                                    onClick={toggleVoice}
                                >
                                    {speech.listening ? <Square className="size-3.5" /> : <Mic />}
                                </Button>
                            )}
                            {streaming ? (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="size-9 shrink-0"
                                    aria-label={t("stop")}
                                    onClick={stop}
                                >
                                    <Square className="size-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    className="size-9 shrink-0"
                                    aria-label={t("send")}
                                    disabled={!draft.trim()}
                                    onClick={() => void send(draft)}
                                >
                                    <ArrowUp />
                                </Button>
                            )}
                        </div>
                        <p className="label mt-2 flex items-center gap-1.5 px-1">
                            {t("disclaimerShort")}
                            <Hint text={t("disclaimer")} />
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
