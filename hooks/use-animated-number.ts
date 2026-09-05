"use client";

import { useEffect, useRef, useState } from "react";

/** How long the digits take to run from the old figure to the new one. */
const DEFAULT_DURATION = 650;

export type CountDirection = "up" | "down" | null;

/** Fast off the mark, gentle on the landing, so the figure never overshoots. */
const easeOutQuart = (progress: number) => 1 - Math.pow(1 - progress, 4);

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Runs the shown number from wherever it currently sits to `value`, so a balance
 * change reads as money moving rather than as a figure that silently swaps. The
 * value at mount is shown as is - only later changes are animated.
 */
export const useAnimatedNumber = (value: number, duration = DEFAULT_DURATION) => {
    const [displayed, setDisplayed] = useState(value);
    const [direction, setDirection] = useState<CountDirection>(null);
    const displayedRef = useRef(value);
    const frameRef = useRef<number | null>(null);
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }

        const from = displayedRef.current;

        if (from === value) return;

        const settle = () => {
            displayedRef.current = value;
            setDisplayed(value);
            setDirection(null);
        };

        if (!Number.isFinite(from) || !Number.isFinite(value) || duration <= 0 || prefersReducedMotion()) {
            settle();
            return;
        }

        // The target is compared against the value on screen, so an update that
        // lands mid-flight simply redirects the run instead of restarting it.
        setDirection(value > from ? "up" : "down");

        const startedAt = performance.now();

        const step = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);

            if (progress === 1) {
                frameRef.current = null;
                settle();
                return;
            }

            displayedRef.current = from + (value - from) * easeOutQuart(progress);
            setDisplayed(displayedRef.current);
            frameRef.current = requestAnimationFrame(step);
        };

        frameRef.current = requestAnimationFrame(step);

        return () => {
            if (frameRef.current === null) return;

            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        };
    }, [value, duration]);

    return { displayed, direction };
};
