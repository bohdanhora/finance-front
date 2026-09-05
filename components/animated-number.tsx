"use client";

import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { useAnimatedNumber } from "hooks/use-animated-number";
import { formatCurrency } from "lib/utils";

/**
 * A figure that counts from its previous value to the new one. Every money
 * amount on the dashboard uses it, so an income or an expense is visible as the
 * numbers running up or down rather than as a silent swap.
 */
export const AnimatedNumber = ({
    value,
    format = formatCurrency,
    duration,
    highlight = false,
    className,
}: {
    value: number;
    format?: (value: number) => string;
    duration?: number;
    /** Tints the digits green while they climb and red while they fall. */
    highlight?: boolean;
    className?: string;
}) => {
    const { displayed, direction } = useAnimatedNumber(value, duration);

    return (
        <span
            className={twMerge(
                "tabular-nums transition-colors duration-500",
                highlight && direction === "up" && "text-emerald-600 dark:text-emerald-400",
                highlight && direction === "down" && "text-rose-600 dark:text-rose-400",
                className,
            )}
        >
            {format(displayed)}
        </span>
    );
};

/** The same counter with the currency symbol kept still next to it. */
export const AnimatedMoney = ({
    value,
    symbol,
    prefix,
    highlight,
    duration,
    className,
    symbolClassName,
}: {
    value: number;
    symbol: string;
    prefix?: string;
    highlight?: boolean;
    duration?: number;
    className?: string;
    symbolClassName?: string;
}) => (
    <span className={twMerge("tabular-nums", className)}>
        {prefix}
        <AnimatedNumber value={value} highlight={highlight} duration={duration} />{" "}
        <span className={symbolClassName}>{symbol}</span>
    </span>
);

/** How long the "+1,050.00" note stays up after a change, in milliseconds. */
const DELTA_LIFETIME = 1800;

/**
 * The size of the last change, shown for a moment beside the balance so it is
 * clear what the running digits are counting.
 */
export const AmountDelta = ({ value, symbol, className }: { value: number; symbol: string; className?: string }) => {
    const previousRef = useRef(value);
    const [change, setChange] = useState<{ id: number; amount: number } | null>(null);

    useEffect(() => {
        const amount = value - previousRef.current;
        previousRef.current = value;

        if (!amount || !Number.isFinite(amount)) return;

        const entry = { id: Date.now(), amount };
        setChange(entry);

        const timeout = setTimeout(
            () => setChange((current) => (current?.id === entry.id ? null : current)),
            DELTA_LIFETIME,
        );

        return () => clearTimeout(timeout);
    }, [value]);

    if (!change) return null;

    const grew = change.amount > 0;

    return (
        <span
            key={change.id}
            aria-hidden="true"
            className={twMerge(
                "amount-delta text-sm font-semibold tabular-nums",
                grew ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                className,
            )}
        >
            {grew ? "+" : "-"}
            {formatCurrency(Math.abs(change.amount))} {symbol}
        </span>
    );
};
