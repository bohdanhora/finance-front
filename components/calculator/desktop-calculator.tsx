"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { GripHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

export const CALCULATOR_TOGGLE_EVENT = "finance:toggle-calculator";

type Operation = "+" | "−" | "×" | "÷";
type Position = { x: number; y: number };

const POSITION_STORAGE_KEY = "finance-calculator-position";
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
    } catch {
        // A stale position should never prevent the calculator from opening.
    }
    return null;
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
                setDisplay(formatResult(result));
                setStoredValue(result);
            } else if (storedValue === null) {
                setStoredValue(inputValue);
            }

            setOperation(nextOperation);
            setWaitingForOperand(true);
        },
        [clear, display, operation, storedValue, waitingForOperand],
    );

    const equals = React.useCallback(() => {
        if (!operation || storedValue === null || display === "Error") return;
        const result = calculate(storedValue, Number(display), operation);
        setDisplay(formatResult(result));
        setStoredValue(null);
        setOperation(null);
        setWaitingForOperand(true);
    }, [display, operation, storedValue]);

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
    }, [backspace, chooseOperation, equals, inputDecimal, inputDigit, open, percent]);

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
        "flex h-12 items-center justify-center rounded-2xl text-lg font-semibold outline-none transition-all hover:brightness-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
    const numberButton = "bg-white/10 text-white hover:bg-white/15";
    const functionButton = "bg-zinc-500/55 text-white hover:bg-zinc-500/70";
    const operationButton = "bg-indigo-600 text-white shadow-md shadow-indigo-950/30 hover:bg-indigo-500";

    return createPortal(
        <section
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={t("title")}
            className="pointer-events-auto fixed z-[80] hidden w-[19rem] overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 text-white shadow-[0_28px_90px_-22px_rgba(0,0,0,0.8)] ring-1 ring-black/30 select-none lg:block"
            style={position ? { left: position.x, top: position.y } : { right: 24, top: 76 }}
        >
            <div
                className="flex h-11 touch-none cursor-grab items-center justify-between border-b border-white/8 px-3 active:cursor-grabbing"
                onPointerDown={startDrag}
                onPointerMove={move}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
            >
                <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <GripHorizontal className="size-4" />
                    {t("title")}
                </span>
                <button
                    type="button"
                    className="flex size-7 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={t("close")}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setOpen(false)}
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="flex min-h-24 flex-col items-end justify-end px-5 pt-4 pb-3">
                <span className="h-5 text-xs text-zinc-500">
                    {operation && storedValue !== null ? `${formatResult(storedValue)} ${operation}` : ""}
                </span>
                <output className="max-w-full overflow-hidden text-right text-[2.65rem] leading-tight font-light tracking-tight text-ellipsis whitespace-nowrap">
                    {display}
                </output>
            </div>

            <div className="grid grid-cols-4 gap-2 p-3 pt-1">
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
                    className={twMerge(actionButton, numberButton, "col-span-2 justify-start pl-5")}
                    onClick={() => inputDigit("0")}
                >
                    0
                </button>
                <button type="button" className={twMerge(actionButton, numberButton)} onClick={inputDecimal}>
                    .
                </button>
                <button type="button" className={twMerge(actionButton, operationButton)} onClick={equals}>
                    =
                </button>
            </div>
        </section>,
        document.body,
    );
};
