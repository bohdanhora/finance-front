"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Eraser, Sparkles, Square, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Button } from "components/ui/button";
import { useAssistantSettings } from "hooks/use-assistant-settings";
import { useIsMobile } from "hooks/use-is-mobile";
import { buildInstructions } from "lib/assistant/prompt";
import { ASSISTANT_OPEN_EVENT, AssistantMessage, readAssistantChat, saveAssistantChat } from "lib/assistant/storage";
import { useAccountSnapshot } from "./use-account-snapshot";

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

    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

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

        const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: question }];
        const replyId = crypto.randomUUID();

        setDraft("");
        setError(null);
        setStreaming(true);
        setMessages(persist([...history, { id: replyId, role: "assistant", content: "" }]));

        const controller = new AbortController();
        abortRef.current = controller;

        const appendChunk = (chunk: string) =>
            setMessages((current) =>
                persist(
                    current.map((message) =>
                        message.id === replyId ? { ...message, content: message.content + chunk } : message,
                    ),
                ),
            );

        try {
            const { streamAssistantReply } = await import("api/assistant");

            await streamAssistantReply({
                connection: { provider, apiKey, model, baseURL: baseURL || undefined },
                instructions: buildInstructions(locale),
                snapshot: buildSnapshot(),
                messages: history,
                signal: controller.signal,
                onText: appendChunk,
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

    return (
        <>
            <button
                type="button"
                aria-label={t("open")}
                title={t("open")}
                onClick={() => setOpen((current) => !current)}
                className={twMerge(
                    "fixed right-4 bottom-20 z-50 flex size-13 cursor-pointer items-center justify-center rounded-2xl",
                    "bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-lg shadow-indigo-500/30",
                    "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-xl",
                    "sm:right-6 sm:bottom-6",
                    open && "scale-95 opacity-0",
                )}
            >
                <Sparkles className="size-5" />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label={t("title")}
                    className={twMerge(
                        "border-border bg-card fixed z-50 flex flex-col overflow-hidden border shadow-2xl",
                        "inset-x-0 top-0 bottom-[var(--keyboard-inset,0px)] rounded-none",
                        "sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(38rem,calc(100dvh-3rem))] sm:w-[26rem] sm:rounded-3xl",
                    )}
                >
                    <header className="border-border/70 flex items-center gap-2 border-b px-4 py-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white">
                            <Sparkles className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{t("title")}</p>
                            <p className="text-muted-foreground truncate text-xs">{t("subtitle")}</p>
                        </div>
                        {visible.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl"
                                aria-label={t("newChat")}
                                title={t("newChat")}
                                onClick={reset}
                            >
                                <Eraser />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl"
                            aria-label={t("close")}
                            onClick={() => setOpen(false)}
                        >
                            <X />
                        </Button>
                    </header>

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
                        {visible.length === 0 ? (
                            <div className="flex flex-col gap-3 py-6">
                                <p className="text-sm font-medium">{t("emptyTitle")}</p>
                                <p className="text-muted-foreground text-sm leading-relaxed">{t("emptyHint")}</p>
                                <div className="flex flex-col gap-2 pt-2">
                                    {SUGGESTION_KEYS.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => void send(t(`suggestions.${suggestion}`))}
                                            className="border-border hover:bg-muted cursor-pointer rounded-xl border px-3 py-2.5 text-left text-sm"
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
                                                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                                                mine
                                                    ? "bg-indigo-500/12 text-foreground rounded-br-md"
                                                    : "bg-muted/70 rounded-bl-md",
                                            )}
                                        >
                                            {pending ? (
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                                                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                                                    <span className="size-1.5 animate-bounce rounded-full bg-current" />
                                                </span>
                                            ) : (
                                                message.content
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {error && (
                            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="border-border/70 border-t p-3">
                        <div className="border-input bg-black/[0.02] focus-within:border-indigo-500 flex items-end gap-2 rounded-2xl border px-3 py-2 transition-colors dark:bg-white/[0.04]">
                            <textarea
                                rows={1}
                                value={draft}
                                enterKeyHint="send"
                                placeholder={t("placeholder")}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key !== "Enter" || event.shiftKey || isMobile) return;
                                    event.preventDefault();
                                    void send(draft);
                                }}
                                className="placeholder:text-muted-foreground max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base outline-none md:text-sm"
                            />
                            {streaming ? (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="size-9 shrink-0 rounded-xl"
                                    aria-label={t("stop")}
                                    onClick={stop}
                                >
                                    <Square className="size-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    className="size-9 shrink-0 rounded-xl"
                                    aria-label={t("send")}
                                    disabled={!draft.trim()}
                                    onClick={() => void send(draft)}
                                >
                                    <ArrowUp />
                                </Button>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-2 px-1 text-[0.68rem] leading-relaxed">
                            {t("disclaimer")}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
