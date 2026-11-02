"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Copy, GripHorizontal, History, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

export const CALCULATOR_TOGGLE_EVENT = "finance:toggle-calculator";

type Operation = "+" | "−" | "×" | "÷";
type Position = { x: number; y: number };
type HistoryEntry = { id: string; expression: string; result: string };

const POSITION_STORAGE_KEY = "finance-calculator-position";
const HISTORY_STORAGE_KEY = "finance-calculator-history";
const HISTORY_LIMIT = 20;
const SCREEN_GAP = 16;

const calculate = (left: number, right: number, operation: Operation) => {
    if (operation === "+") return left + right;
    if (operation === "−") return left - right;
    if (operation === "×") return left * right;
    return right === 0 ? Number.NaN : left / right;
};

const formatResult = (value: number) => {
    if (!Number.isFinite(value)) return "Error";
    if (value === 0) return "0";

    const rounded = Number(value.toPrecision(12));
    const absolute = Math.abs(rounded);

    if (absolute >= 1e12 || absolute < 1e-9) {
        return rounded
            .toExponential(7)
            .replace(/\.0+e/, "e")
            .replace(/(\.\d*?)0+e/, "$1e");
    }

    return String(rounded);
};

const readSavedPosition = (): Position | null => {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(POSITION_STORAGE_KEY) ?? "null") as Position | null;
        if (parsed && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) return parsed;
    } catch {}
    return null;
};

const readSavedHistory = (): HistoryEntry[] => {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]") as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(
                (entry): entry is HistoryEntry =>
                    typeof entry?.id === "string" &&
                    typeof entry?.expression === "string" &&
                    typeof entry?.result === "string",
            )
            .slice(0, HISTORY_LIMIT);
    } catch {
        return [];
    }
};

export const DesktopCalculator = () => {
    const t = useTranslations("calculator");
    const panelRef = React.useRef<HTMLDivElement>(null);
    const dragRef = React.useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

    const [mounted, setMounted] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [position, setPosition] = React.useState<Position | null>(null);
    const [display, setDisplay] = React.useState("0");
    const [storedValue, setStoredValue] = React.useState<number | null>(null);
    const [operation, setOperation] = React.useState<Operation | null>(null);
    const [waitingForOperand, setWaitingForOperand] = React.useState(false);
    const [history, setHistory] = React.useState<HistoryEntry[]>([]);
    const [historyLoaded, setHistoryLoaded] = React.useState(false);
    const [showHistory, setShowHistory] = React.useState(false);
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
    const copiedTimerRef = React.useRef<number | null>(null);

    const clampPosition = React.useCallback((next: Position): Position => {
        const width = panelRef.current?.offsetWidth ?? 304;
        const height = panelRef.current?.offsetHeight ?? 500;

        return {
            x: Math.max(SCREEN_GAP, Math.min(next.x, window.innerWidth - width - SCREEN_GAP)),
            y: Math.max(SCREEN_GAP, Math.min(next.y, window.innerHeight - height - SCREEN_GAP)),
        };
    }, []);

    React.useEffect(() => {
        setMounted(true);
        setHistory(readSavedHistory());
        setHistoryLoaded(true);

        const toggle = () => setOpen((current) => !current);
        window.addEventListener(CALCULATOR_TOGGLE_EVENT, toggle);
        return () => window.removeEventListener(CALCULATOR_TOGGLE_EVENT, toggle);
    }, []);

    React.useEffect(() => {
        if (!open) return;

        const frame = window.requestAnimationFrame(() => {
            const saved = readSavedPosition();
            setPosition((current) =>
                clampPosition(
                    current ??
                        saved ?? {
                            x: window.innerWidth - (panelRef.current?.offsetWidth ?? 304) - 24,
                            y: 76,
                        },
                ),
            );
        });

        return () => window.cancelAnimationFrame(frame);
    }, [clampPosition, open]);

    React.useEffect(() => {
        if (!open) return;

        const keepOnScreen = () => setPosition((current) => (current ? clampPosition(current) : current));
        window.addEventListener("resize", keepOnScreen);
        return () => window.removeEventListener("resize", keepOnScreen);
    }, [clampPosition, open]);

    React.useEffect(() => {
        if (!historyLoaded) return;
        try {
            window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch {}
    }, [history, historyLoaded]);

    React.useEffect(() => {
        if (!open) return;
        const frame = window.requestAnimationFrame(() =>
            setPosition((current) => (current ? clampPosition(current) : current)),
        );
        return () => window.cancelAnimationFrame(frame);
    }, [clampPosition, open, showHistory]);

    React.useEffect(
        () => () => {
            if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
        },
        [],
    );

    const pushHistory = React.useCallback((left: number, right: number, operation: Operation, result: number) => {
        if (!Number.isFinite(result)) return;
        const entry: HistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            expression: `${formatResult(left)} ${operation} ${formatResult(right)}`,
            result: formatResult(result),
        };
        setHistory((current) => [entry, ...current].slice(0, HISTORY_LIMIT));
    }, []);

    const copyValue = React.useCallback((value: string, key: string) => {
        if (value === "Error" || !navigator.clipboard) return;
        navigator.clipboard
            .writeText(value)
            .then(() => {
                setCopiedKey(key);
                if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
                copiedTimerRef.current = window.setTimeout(() => setCopiedKey(null), 1200);
            })
            .catch(() => {});
    }, []);

    const applyHistoryResult = React.useCallback((value: string) => {
        setDisplay(value);
        setWaitingForOperand(false);
    }, []);

    const clear = React.useCallback(() => {
        setDisplay("0");
        setStoredValue(null);
        setOperation(null);
        setWaitingForOperand(false);
    }, []);

    const inputDigit = React.useCallback(
        (digit: string) => {
            if (display === "Error" || waitingForOperand) {
                setDisplay(digit);
                setWaitingForOperand(false);
                return;
            }

            const digitCount = display.replace(/[-.]/g, "").length;
            if (digitCount >= 12) return;
            setDisplay((current) => (current === "0" ? digit : `${current}${digit}`));
        },
        [display, waitingForOperand],
    );

    const inputDecimal = React.useCallback(() => {
        if (display === "Error" || waitingForOperand) {
            setDisplay("0.");
            setWaitingForOperand(false);
            return;
        }
        if (!display.includes(".")) setDisplay((current) => `${current}.`);
    }, [display, waitingForOperand]);

    const chooseOperation = React.useCallback(
        (nextOperation: Operation) => {
            const inputValue = Number(display);
            if (!Number.isFinite(inputValue)) {
                clear();
                return;
            }

            if (operation && storedValue !== null && !waitingForOperand) {
                const result = calculate(storedValue, inputValue, operation);
                pushHistory(storedValue, inputValue, operation, result);
                setDisplay(formatResult(result));
                setStoredValue(result);
            } else if (storedValue === null) {
                setStoredValue(inputValue);
            }

            setOperation(nextOperation);
            setWaitingForOperand(true);
        },
        [clear, display, operation, pushHistory, storedValue, waitingForOperand],
    );

    const equals = React.useCallback(() => {
        if (!operation || storedValue === null || display === "Error") return;
        const inputValue = Number(display);
        const result = calculate(storedValue, inputValue, operation);
        pushHistory(storedValue, inputValue, operation, result);
        setDisplay(formatResult(result));
        setStoredValue(null);
        setOperation(null);
        setWaitingForOperand(true);
    }, [display, operation, pushHistory, storedValue]);

    const toggleSign = React.useCallback(() => {
        if (display === "0" || display === "Error") return;
        setDisplay((current) => (current.startsWith("-") ? current.slice(1) : `-${current}`));
    }, [display]);

    const percent = React.useCallback(() => {
        if (display === "Error") return;
        setDisplay(formatResult(Number(display) / 100));
    }, [display]);

    const backspace = React.useCallback(() => {
        if (display === "Error" || waitingForOperand) return;
        setDisplay((current) =>
            current.length <= 1 || (current.length === 2 && current.startsWith("-")) ? "0" : current.slice(0, -1),
        );
    }, [display, waitingForOperand]);

    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.matches("input, textarea, select, [contenteditable='true']")) return;

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
                if (window.getSelection()?.toString()) return;
                copyValue(display, "display");
                event.preventDefault();
                return;
            }
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            if (/^\d$/.test(event.key)) inputDigit(event.key);
            else if (event.key === "." || event.key === ",") inputDecimal();
            else if (event.key === "+") chooseOperation("+");
            else if (event.key === "-") chooseOperation("−");
            else if (event.key === "*") chooseOperation("×");
            else if (event.key === "/") chooseOperation("÷");
            else if (event.key === "Enter" || event.key === "=") equals();
            else if (event.key === "%") percent();
            else if (event.key === "Backspace") backspace();
            else if (event.key === "Escape") setOpen(false);
            else return;

            event.preventDefault();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [backspace, chooseOperation, copyValue, display, equals, inputDecimal, inputDigit, open, percent]);

    const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!position || event.button !== 0) return;
        dragRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - position.x,
            offsetY: event.clientY - position.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const move = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        setPosition(clampPosition({ x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY }));
    };

    const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (position) window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    };

    if (!mounted || !open) return null;

    const actionButton =
        "flex h-12 items-center justify-center bg-paper font-mono text-base transition-colors outline-none active:bg-wash";
    const numberButton = "text-ink hover:bg-surface";
    const functionButton = "text-ink-faint text-xs hover:bg-surface hover:text-ink";
    const operationButton = "text-accent hover:bg-accent hover:text-on-accent";

    return createPortal(
        <section
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={t("title")}
            className="bg-paper text-ink border-rule-strong pointer-events-auto fixed z-50 hidden w-76 border select-none lg:block"
            style={position ? { left: position.x, top: position.y } : { right: 24, top: 76 }}
        >
            <div
                className="border-rule-strong flex h-10 cursor-grab touch-none items-center justify-between border-b px-3 active:cursor-grabbing"
                onPointerDown={startDrag}
                onPointerMove={move}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
            >
                <span className="label flex items-center gap-2">
                    <GripHorizontal className="size-4" />
                    {t("title")}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className={twMerge(
                            "text-ink-faint hover:text-ink flex size-7 items-center justify-center transition-colors",
                            showHistory && "text-accent hover:text-accent",
                        )}
                        aria-label={t("history")}
                        aria-pressed={showHistory}
                        title={t("history")}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => setShowHistory((current) => !current)}
                    >
                        <History className="size-4" />
                    </button>
                    <button
                        type="button"
                        className="text-ink-faint hover:text-ink flex size-7 items-center justify-center transition-colors"
                        aria-label={t("close")}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => setOpen(false)}
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            <div className="flex min-h-24 flex-col items-end justify-end px-5 pt-4 pb-3">
                <div className="flex h-5 w-full items-center justify-between gap-3">
                    <button
                        type="button"
                        className={twMerge(
                            "text-ink-faint hover:text-ink -ml-1 flex items-center gap-1.5 px-1 font-mono text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                            copiedKey === "display" && "text-accent hover:text-accent",
                        )}
                        disabled={display === "Error"}
                        title={t("copy")}
                        onClick={() => copyValue(display, "display")}
                    >
                        {copiedKey === "display" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {copiedKey === "display" ? t("copied") : t("copy")}
                    </button>
                    <span className="text-ink-faint truncate font-mono text-xs">
                        {operation && storedValue !== null ? `${formatResult(storedValue)} ${operation}` : ""}
                    </span>
                </div>
                <output className="figure max-w-full overflow-hidden text-right text-4xl leading-tight text-ellipsis whitespace-nowrap">
                    {display}
                </output>
            </div>

            <div className="bg-rule border-rule grid grid-cols-4 gap-px border-t">
                <button type="button" className={twMerge(actionButton, functionButton)} onClick={clear}>
                    {display === "0" && storedValue === null ? "AC" : "C"}
                </button>
                <button type="button" className={twMerge(actionButton, functionButton)} onClick={toggleSign}>
                    ±
                </button>
                <button type="button" className={twMerge(actionButton, functionButton)} onClick={percent}>
                    %
                </button>
                <button
                    type="button"
                    className={twMerge(actionButton, operationButton)}
                    onClick={() => chooseOperation("÷")}
                >
                    ÷
                </button>

                {["7", "8", "9"].map((digit) => (
                    <button
                        key={digit}
                        type="button"
                        className={twMerge(actionButton, numberButton)}
                        onClick={() => inputDigit(digit)}
                    >
                        {digit}
                    </button>
                ))}
                <button
                    type="button"
                    className={twMerge(actionButton, operationButton)}
                    onClick={() => chooseOperation("×")}
                >
                    ×
                </button>

                {["4", "5", "6"].map((digit) => (
                    <button
                        key={digit}
                        type="button"
                        className={twMerge(actionButton, numberButton)}
                        onClick={() => inputDigit(digit)}
                    >
                        {digit}
                    </button>
                ))}
                <button
                    type="button"
                    className={twMerge(actionButton, operationButton)}
                    onClick={() => chooseOperation("−")}
                >
                    −
                </button>

                {["1", "2", "3"].map((digit) => (
                    <button
                        key={digit}
                        type="button"
                        className={twMerge(actionButton, numberButton)}
                        onClick={() => inputDigit(digit)}
                    >
                        {digit}
                    </button>
                ))}
                <button
                    type="button"
                    className={twMerge(actionButton, operationButton)}
                    onClick={() => chooseOperation("+")}
                >
                    +
                </button>

                <button
                    type="button"
                    className={twMerge(actionButton, numberButton, "col-span-2")}
                    onClick={() => inputDigit("0")}
                >
                    0
                </button>
                <button type="button" className={twMerge(actionButton, numberButton)} onClick={inputDecimal}>
                    .
                </button>
                <button
                    type="button"
                    className={twMerge(actionButton, "bg-accent text-on-accent hover:bg-ink hover:text-paper")}
                    onClick={equals}
                >
                    =
                </button>
            </div>

            {showHistory && (
                <div className="border-rule-strong border-t">
                    <div className="border-rule flex h-9 items-center justify-between border-b px-3">
                        <span className="label">{t("history")}</span>
                        <button
                            type="button"
                            className="text-ink-faint hover:text-ink flex items-center gap-1.5 font-mono text-xs transition-colors disabled:pointer-events-none disabled:opacity-40"
                            disabled={history.length === 0}
                            onClick={() => setHistory([])}
                        >
                            <Trash2 className="size-3.5" />
                            {t("clearHistory")}
                        </button>
                    </div>
                    {history.length === 0 ? (
                        <p className="text-ink-faint px-3 py-4 text-center font-mono text-xs">{t("emptyHistory")}</p>
                    ) : (
                        <ul className="divide-rule max-h-56 divide-y overflow-y-auto">
                            {history.map((entry) => (
                                <li key={entry.id} className="flex items-stretch">
                                    <button
                                        type="button"
                                        className="hover:bg-surface flex min-w-0 flex-1 flex-col items-end px-3 py-2 text-right transition-colors"
                                        title={t("useResult")}
                                        onClick={() => applyHistoryResult(entry.result)}
                                    >
                                        <span className="text-ink-faint w-full truncate font-mono text-xs">
                                            {entry.expression} =
                                        </span>
                                        <span className="figure w-full truncate text-lg">{entry.result}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={twMerge(
                                            "text-ink-faint hover:bg-surface hover:text-ink border-rule flex w-10 shrink-0 items-center justify-center border-l transition-colors",
                                            copiedKey === entry.id && "text-accent hover:text-accent",
                                        )}
                                        aria-label={t("copy")}
                                        title={t("copy")}
                                        onClick={() => copyValue(entry.result, entry.id)}
                                    >
                                        {copiedKey === entry.id ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <Copy className="size-4" />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>,
        document.body,
    );
};
