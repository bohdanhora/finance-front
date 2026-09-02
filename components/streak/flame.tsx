"use client";

import { CSSProperties, useId } from "react";
import { twMerge } from "tailwind-merge";

import { StreakTierKey } from "lib/streak";

type FlamePalette = {
    /** Gradient stops of the flame body, tip first. */
    outer: [string, string];
    /** The hotter inner tongue burning behind the coin. */
    core: [string, string];
    /** Colour of the halo and of the coins drifting up from the flame. */
    glow: string;
    coin: [string, string];
    /** The currency sign stamped on the coin. */
    ink: string;
    /** Flicker period: the hotter the tier, the livelier the flame. */
    speed: string;
    /** Accent used by the badge and the dialog around the flame. */
    accent: string;
};

export const TIER_PALETTE: Record<StreakTierKey, FlamePalette> = {
    dormant: {
        outer: ["#d4d4d8", "#a1a1aa"],
        core: ["#e4e4e7", "#c4c4c8"],
        glow: "113 113 122",
        coin: ["#f4f4f5", "#d4d4d8"],
        ink: "#52525b",
        speed: "0s",
        accent: "#71717a",
    },
    spark: {
        outer: ["#fef08a", "#fbbf24"],
        core: ["#fefce8", "#fde68a"],
        glow: "245 158 11",
        coin: ["#fffbeb", "#fde68a"],
        ink: "#92400e",
        speed: "3.4s",
        accent: "#f59e0b",
    },
    flame: {
        outer: ["#fb923c", "#e11d48"],
        core: ["#fef3c7", "#fb923c"],
        glow: "249 115 22",
        coin: ["#fffbeb", "#fcd34d"],
        ink: "#9a3412",
        speed: "2.4s",
        accent: "#f97316",
    },
    blaze: {
        outer: ["#c4b5fd", "#4338ca"],
        core: ["#ffffff", "#a5b4fc"],
        glow: "99 102 241",
        coin: ["#ffffff", "#c7d2fe"],
        ink: "#3730a3",
        speed: "1.7s",
        accent: "#6366f1",
    },
    vault: {
        outer: ["#fde047", "#b45309"],
        core: ["#ffffff", "#fcd34d"],
        glow: "217 119 6",
        coin: ["#fffbeb", "#fbbf24"],
        ink: "#78350f",
        speed: "1.2s",
        accent: "#d97706",
    },
};

/** Tips at the top, bulges at the bottom, with one lick curling up the left. */
const FLAME_PATH =
    "M20 2C21.5 10 27 13 30.5 18C33 21.5 34 25 34 28.5C34 36.5 27.7 43 20 43C12.3 43 6 36.5 6 28.5C6 23.5 8 19.5 11 16.5C11.2 20.5 12.6 22.8 14.6 24C12 16.5 14.5 8 20 2Z";

const CORE_PATH =
    "M20 15C21 20 24.5 22.5 26 25.5C27 27.5 27.4 29.5 27.4 31C27.4 36.5 24 40 20 40C16 40 12.6 36.5 12.6 31C12.6 28 14 25 16 22.5C16.2 25 16.8 26.3 18 27C16.5 22.5 17.5 18 20 15Z";

/** Sideways drift of each coin rising off the flame, in that order. */
const COIN_DRIFT = ["-70%", "55%", "-20%"];

type StreakFlameProps = {
    tier: StreakTierKey;
    /** Width in pixels; the flame is a fifth taller than it is wide. */
    size?: number;
    /** Currency sign on the coin. It is only legible on the larger flames. */
    symbol?: string;
    className?: string;
};

/**
 * The streak flame: a coin burning at its heart. Each tier changes the colour,
 * the flicker speed and what the flame throws off, so a hundred day run is
 * recognisable at a glance from a nine day one.
 */
export const StreakFlame = ({ tier, size = 22, symbol, className }: StreakFlameProps) => {
    const id = useId().replace(/:/g, "");
    const palette = TIER_PALETTE[tier];

    const lit = tier !== "dormant";
    const showCoins = lit && tier !== "spark" && size >= 40;
    const showSymbol = Boolean(symbol) && size >= 34;

    return (
        <span
            data-tier={tier}
            className={twMerge("streak-flame relative inline-flex shrink-0 items-center justify-center", className)}
            style={
                {
                    width: size,
                    height: size * 1.2,
                    "--flame-speed": palette.speed,
                    "--flame-glow": palette.glow,
                } as CSSProperties
            }
        >
            <span aria-hidden="true" className="streak-glow" />

            {showCoins &&
                COIN_DRIFT.map((drift, index) => (
                    <span
                        key={drift}
                        aria-hidden="true"
                        className="streak-coin"
                        style={
                            {
                                "--coin-drift": drift,
                                width: Math.max(4, size * 0.13),
                                height: Math.max(4, size * 0.13),
                                animationDelay: `${index * 0.9}s`,
                            } as CSSProperties
                        }
                    />
                ))}

            <svg viewBox="0 0 40 48" width={size} height={size * 1.2} className="relative" aria-hidden="true">
                <defs>
                    <linearGradient id={`${id}-outer`} x1="20" y1="2" x2="20" y2="43" gradientUnits="userSpaceOnUse">
                        <stop stopColor={palette.outer[0]} />
                        <stop offset="1" stopColor={palette.outer[1]} />
                    </linearGradient>
                    <linearGradient id={`${id}-core`} x1="20" y1="15" x2="20" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor={palette.core[0]} />
                        <stop offset="1" stopColor={palette.core[1]} />
                    </linearGradient>
                    <linearGradient id={`${id}-coin`} x1="14" y1="25" x2="26" y2="38" gradientUnits="userSpaceOnUse">
                        <stop stopColor={palette.coin[0]} />
                        <stop offset="1" stopColor={palette.coin[1]} />
                    </linearGradient>
                    <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0">
                        <stop stopColor="#ffffff" stopOpacity="0" />
                        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.65" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                    <clipPath id={`${id}-clip`}>
                        <path d={FLAME_PATH} />
                    </clipPath>
                </defs>

                <path className="streak-outer" d={FLAME_PATH} fill={`url(#${id}-outer)`} />
                <path className="streak-core" d={CORE_PATH} fill={`url(#${id}-core)`} opacity="0.92" />

                <circle cx="20" cy="31" r="7.4" fill={`url(#${id}-coin)`} />
                <circle cx="20" cy="31" r="7.4" fill="none" stroke={palette.ink} strokeOpacity="0.35" strokeWidth="1" />
                <circle
                    cx="20"
                    cy="31"
                    r="5.3"
                    fill="none"
                    stroke={palette.ink}
                    strokeOpacity="0.2"
                    strokeWidth="0.8"
                />

                {showSymbol && (
                    <text
                        x="20"
                        y="31"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="700"
                        fill={palette.ink}
                    >
                        {symbol}
                    </text>
                )}

                {/* Only the top tier is polished enough to catch the light. */}
                {tier === "vault" && (
                    <g clipPath={`url(#${id}-clip)`}>
                        <rect
                            className="streak-shine"
                            x="-14"
                            y="0"
                            width="14"
                            height="48"
                            fill={`url(#${id}-shine)`}
                        />
                    </g>
                )}
            </svg>
        </span>
    );
};
