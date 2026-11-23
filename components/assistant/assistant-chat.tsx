"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Eraser, Loader2, Mic, Sparkles, Square, X } from "lucide-react";
import { twMerge } from "lib/tw";

import { Button } from "components/ui/button";
import { useAssistantSettings } from "hooks/use-assistant-settings";
import { useIsMobile } from "hooks/use-is-mobile";
import { buildInstructions } from "lib/assistant/prompt";
import {
    ASSISTANT_OPEN_EVENT,
    AssistantMessage,
    OperationsProposal as Proposal,
    readAssistantChat,
    saveAssistantChat,
} from "lib/assistant/storage";
import { extractOperations, prepareOperations, ProposedOperation, visibleReply } from "lib/assistant/tools";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { useSetNewTransaction } from "api/main";
import { useCardTransfer } from "api/cards";
import { TransactionEnum } from "constants/index";
import { SavingsStorage } from "types/transactions";
import useStore from "store/general";
import { OperationsProposal } from "./operations-proposal";
import { useAccountSnapshot } from "./use-account-snapshot";
import { joinText, useSpeechInput } from "hooks/use-speech-input";
import { useVoiceRecorder } from "hooks/use-voice-recorder";
import { canTranscribe, transcribeSpeech } from "api/assistant";
import { toSpeechWav } from "lib/audio-wav";
import { Hint } from "components/hint";

const SUGGESTION_KEYS = ["spending", "saving", "bills", "afford"] as const;

export const AssistantChat = () => {
    const t = useTranslations("assistant");
    const locale = useLocale();
    const isMobile = useIsMobile();
    const { provider, apiKey, model, baseURL, connected } = useAssistantSettings();
    const buildSnapshot = useAccountSnapshot();

    const [open, setOpen] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const speech = useSpeechInput({ locale, onText: setDraft });
    const recorder = useVoiceRecorder();
    const cards = useStore((state) => state.cards);
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [refineFailed, setRefineFailed] = useState(false);
    const voiceBaseRef = useRef("");
    const modelVoice = Boolean(apiKey) && canTranscribe({ provider });
    const voiceActive = speech.listening || recording;

    const cancelVoice = () => {
        if (speech.listening) speech.stop();
        recorder.cancel();
        setRecording(false);
    };
    const { mutateAsync: addTransaction } = useSetNewTransaction();
    const { mutateAsync: transferBetweenCards } = useCardTransfer();

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

    const updateProposal = (id: string, change: (proposal: Proposal) => Proposal) =>
        setMessages((current) =>
            persist(
                current.map((message) =>
                    message.id === id && message.proposal
                        ? { ...message, proposal: change(message.proposal) }
                        : message,
                ),
            ),
        );

    const saveOperation = async (item: ProposedOperation) => {
        const store = useStore.getState();
        const date = item.date === dayjs().format("YYYY-MM-DD") ? new Date() : dayjs(item.date).hour(12).toDate();

        if (item.type === "transfer" && item.cardId && item.toCardId) {
            await transferBetweenCards({
                fromCardId: item.cardId,
                toCardId: item.toCardId,
                amount: item.amount,
                date: date.toISOString(),
                description: item.description,
            });
            return;
        }

        const isSavings = item.type === "expense" && item.category === "savings";
        const response = await addTransaction({
            transactionType: item.type === "income" ? TransactionEnum.INCOME : TransactionEnum.EXPENSE,
            id: uuidv4(),
            value: item.amount,
            date,
            categorie: item.type === "income" ? TransactionEnum.INCOME : item.category,
            description: item.description,
            cardId: item.cardId,
            ...(isSavings ? { savingsStorage: SavingsStorage.CARD, savingsCurrency: store.userCurrency } : {}),
        });

        store.applyServerUpdate(response);
        store.setTransactions(response.updatedItems);
        if (response.updatedSavingsOperations) store.setSavingsOperations(response.updatedSavingsOperations);
    };

    const confirmProposal = async (message: AssistantMessage) => {
        const proposal = message.proposal;
        if (!proposal || proposal.status === "saving") return;

        updateProposal(message.id, (current) => ({ ...current, status: "saving" }));
        const done = [...proposal.done];

        for (const [index, item] of proposal.operations.entries()) {
            if (done.includes(index)) continue;
            try {
                await saveOperation(item);
                done.push(index);
                updateProposal(message.id, (current) => ({ ...current, done: [...done] }));
            } catch {
                updateProposal(message.id, (current) => ({ ...current, done: [...done], status: "failed" }));
                return;
            }
        }

        updateProposal(message.id, (current) => ({ ...current, done: [...done], status: "added" }));
        toast.success(t("operations.added", { count: proposal.operations.length }));
    };

    const send = async (text: string) => {
        const question = text.trim();
        if (!question || streaming || transcribing || !apiKey || !model) return;
        cancelVoice();

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
                persist(
                    current.map((message) =>
                        message.id === replyId ? { ...message, content: visibleReply(content) } : message,
                    ),
                ),
            );

        try {
            const { streamAssistantReply } = await import("api/assistant");

            const { snapshot, tools } = buildSnapshot();
            const toolData = {
                ...tools,
                propose: (operations: ProposedOperation[]) =>
                    setMessages((current) =>
                        persist(
                            current.map((message) =>
                                message.id === replyId
                                    ? {
                                          ...message,
                                          proposal: {
                                              operations: [...(message.proposal?.operations ?? []), ...operations],
                                              done: [],
                                              status: "pending",
                                          },
                                      }
                                    : message,
                            ),
                        ),
                    ),
            };

            const answer = await streamAssistantReply({
                connection: { provider, apiKey, model, baseURL: baseURL || undefined },
                instructions: buildInstructions(locale),
                noToolsInstructions: buildInstructions(locale, false),
                snapshot,
                tools: toolData,
                messages: history,
                signal: controller.signal,
                onText: showReply,
                onWorking: setWorking,
                onToolsUnavailable: (reason) =>
                    setMessages((current) =>
                        persist(
                            current.map((message) =>
                                message.id === replyId ? { ...message, toolsUnavailable: reason } : message,
                            ),
                        ),
                    ),
            });

            const written = extractOperations(answer);
            if (written) {
                const result = prepareOperations({ operations: written }, toolData);
                if ("error" in result) {
                    const details = "details" in result && result.details ? result.details.join("\n") : "";
                    showReply(`${answer}\n\n${t("operations.invalid")}${details ? `\n${details}` : ""}`);
                }
            }
        } catch (requestError) {
            const kind = (requestError as { kind?: string })?.kind ?? "unknown";
            setError(t(`errors.${kind}`));
            setMessages((current) =>
                persist(
                    current.map((message) =>
                        message.id === replyId && !message.content && !message.proposal
                            ? { ...message, failed: true }
                            : message,
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

    const close = () => {
        cancelVoice();
        setConfirmClose(false);
        setOpen(false);
    };

    const requestClose = () => {
        if (messages.some((message) => !message.failed)) {
            setConfirmClose(true);
            return;
        }
        close();
    };

    const closeAndClear = () => {
        reset();
        setDraft("");
        close();
    };

    if (!connected) return null;

    const unsaved = messages.some((message) => message.proposal?.status === "pending");

    const visible = messages.filter((message) => !message.failed);

    const finishVoice = async () => {
        if (speech.listening) speech.stop();
        if (!recording) {
            inputRef.current?.focus();
            return;
        }

        setRecording(false);
        setTranscribing(true);
        try {
            const audio = await recorder.stop();
            if (!audio || !apiKey) return;
            const text = await transcribeSpeech({
                connection: { provider, apiKey, model, baseURL: baseURL || undefined },
                audio: await toSpeechWav(audio),
                hints: cards.map((card) => card.name),
            });
            if (text) setDraft(joinText(voiceBaseRef.current, text));
        } catch {
            setRefineFailed(true);
        } finally {
            setTranscribing(false);
            inputRef.current?.focus();
        }
    };

    const toggleVoice = async () => {
        if (voiceActive) {
            await finishVoice();
            return;
        }

        voiceBaseRef.current = draft;
        setRefineFailed(false);
        if (speech.supported) speech.start(draft);
        if (modelVoice) setRecording(await recorder.start());
    };

    return (
        <>
            <button
                type="button"
                aria-label={t("open")}
                title={t("open")}
                onClick={() => (open ? requestClose() : setOpen(true))}
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
                        <Button variant="ghost" size="icon" aria-label={t("close")} onClick={requestClose}>
                            <X />
                        </Button>
                    </header>

                    {confirmClose && (
                        <div role="alertdialog" className="border-rule bg-warn-wash border-b px-4 py-3">
                            <p className="text-sm font-medium">{t("closeConfirm.title")}</p>
                            <p className="text-ink-muted mt-0.5 text-xs">
                                {unsaved ? t("closeConfirm.unsaved") : t("closeConfirm.hint")}
                            </p>
                            <div className="mt-2.5 flex gap-2">
                                <Button size="sm" variant="destructive" onClick={closeAndClear}>
                                    {t("closeConfirm.confirm")}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setConfirmClose(false)}>
                                    {t("closeConfirm.stay")}
                                </Button>
                            </div>
                        </div>
                    )}

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
                                        className={twMerge("flex flex-col", mine ? "items-end" : "items-start")}
                                    >
                                        {(mine || pending || message.content) && (
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
                                        )}
                                        {message.toolsUnavailable && (
                                            <p
                                                className="border-warn text-ink-muted mt-2 max-w-5/6 border-l-2 py-0.5 pl-3 text-xs"
                                                title={message.toolsUnavailable}
                                            >
                                                {t("toolsUnavailable")}
                                            </p>
                                        )}
                                        {message.proposal && (
                                            <OperationsProposal
                                                proposal={message.proposal}
                                                onConfirm={() => void confirmProposal(message)}
                                                onCancel={() =>
                                                    updateProposal(message.id, (current) => ({
                                                        ...current,
                                                        status: "cancelled",
                                                    }))
                                                }
                                            />
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {error && <p className="border-signal text-signal border-l-2 py-1 pl-3 text-sm">{error}</p>}
                    </div>

                    <div className="border-rule border-t p-3">
                        {voiceActive && (
                            <p className="text-signal mb-2 flex items-center gap-2 px-1 text-xs">
                                <span className="bg-signal size-2 animate-pulse rounded-full" />
                                {t("voice.listening")}
                            </p>
                        )}
                        {transcribing && (
                            <p className="text-ink-muted mb-2 flex items-center gap-2 px-1 text-xs">
                                <Loader2 className="size-3 animate-spin" />
                                {t("voice.transcribing")}
                            </p>
                        )}
                        {!voiceActive && !transcribing && refineFailed && (
                            <p className="text-ink-muted mb-2 px-1 text-xs">{t("voice.errors.refine")}</p>
                        )}
                        {speech.error && !voiceActive && !transcribing && !refineFailed && !modelVoice && (
                            <p className="text-ink-muted mb-2 px-1 text-xs">{t(`voice.errors.${speech.error}`)}</p>
                        )}
                        <div
                            className={twMerge(
                                "border-rule bg-surface focus-within:border-accent flex items-end gap-2 border px-3 py-2 transition-colors",
                                voiceActive && "border-signal focus-within:border-signal",
                            )}
                        >
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={draft}
                                enterKeyHint="send"
                                readOnly={transcribing}
                                placeholder={voiceActive ? t("voice.speak") : t("placeholder")}
                                onChange={(event) => {
                                    if (voiceActive) cancelVoice();
                                    setDraft(event.target.value);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key !== "Enter" || event.shiftKey || isMobile) return;
                                    event.preventDefault();
                                    void send(draft);
                                }}
                                className="placeholder:text-ink-faint field-sizing-content max-h-60 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base outline-none md:text-sm"
                            />
                            {(speech.supported || modelVoice) && !streaming && (
                                <Button
                                    size="icon"
                                    variant={voiceActive ? "destructive" : "ghost"}
                                    className={twMerge("size-9 shrink-0", voiceActive && "animate-pulse")}
                                    aria-label={voiceActive ? t("voice.stop") : t("voice.start")}
                                    title={voiceActive ? t("voice.stop") : t("voice.start")}
                                    aria-pressed={voiceActive}
                                    disabled={transcribing}
                                    onClick={() => void toggleVoice()}
                                >
                                    {transcribing ? (
                                        <Loader2 className="animate-spin" />
                                    ) : voiceActive ? (
                                        <Square className="size-3.5" />
                                    ) : (
                                        <Mic />
                                    )}
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
