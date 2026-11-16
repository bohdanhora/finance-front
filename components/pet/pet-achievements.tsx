"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    CalendarCheck,
    Check,
    Coins,
    CreditCard,
    Flame,
    LucideIcon,
    NotebookPen,
    PieChart,
    PiggyBank,
    ReceiptText,
    Shirt,
    Target,
    TrendingUp,
    Wallet,
} from "lucide-react";

import { twMerge } from "lib/tw";
import { Achievement, AchievementId } from "types/pet";

import { Coin } from "./coin";

const ICONS: Record<AchievementId, LucideIcon> = {
    chronicler: NotebookPen,
    diary: CalendarCheck,
    steady: Flame,
    saver: PiggyBank,
    dreamer: Target,
    debtfree: ReceiptText,
    surplus: TrendingUp,
    earner: Wallet,
    analyst: PieChart,
    collector: CreditCard,
    dandy: Shirt,
    wealthy: Coins,
};

type Medal = { from: string; to: string; rim: string; icon: string };

const MEDALS: Medal[] = [
    { from: "#3a4549", to: "#232b2e", rim: "#4b585d", icon: "#7a868d" },
    { from: "#f3b47c", to: "#b8672c", rim: "#8f4c1d", icon: "#fff7ee" },
    { from: "#f4f7f9", to: "#9eabb5", rim: "#6f7d88", icon: "#ffffff" },
    { from: "#ffe48f", to: "#e0a01a", rim: "#a8700b", icon: "#fffbe8" },
];

const RING = 2 * Math.PI * 46;

const progressOf = ({ value, tier, targets }: Achievement) => {
    if (tier >= targets.length) return 1;
    const from = tier === 0 ? 0 : targets[tier - 1];
    const to = targets[tier];
    return Math.min(Math.max((value - from) / (to - from), 0), 1);
};

export const AchievementMedal = ({ achievement, size = "md" }: { achievement: Achievement; size?: "md" | "lg" }) => {
    const medal = MEDALS[Math.min(achievement.tier, 3)];
    const Icon = ICONS[achievement.id];
    const gradient = `medal-${achievement.id}-${size}`;
    const progress = progressOf(achievement);
    const complete = achievement.tier >= 3;

    return (
        <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className={twMerge("shrink-0", size === "lg" ? "size-28" : "size-20")}
        >
            <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={medal.from} />
                    <stop offset="1" stopColor={medal.to} />
                </linearGradient>
            </defs>
            <circle cx={50} cy={50} r={46} fill="none" stroke="var(--wash)" strokeWidth={5} />
            <circle
                cx={50}
                cy={50}
                r={46}
                fill="none"
                stroke={complete ? medal.to : "var(--accent)"}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={`${RING * progress} ${RING}`}
                transform="rotate(-90 50 50)"
                className="transition-[stroke-dasharray] duration-700"
            />
            <circle cx={50} cy={50} r={36} fill={`url(#${gradient})`} stroke={medal.rim} strokeWidth={4} />
            <path
                d="M27 44 Q30 28 46 22"
                fill="none"
                stroke="#fff"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={achievement.tier > 0 ? 0.7 : 0.15}
            />
            <Icon x={33} y={33} width={34} height={34} color={medal.icon} strokeWidth={2.2} />
        </svg>
    );
};

const TierDots = ({ tier }: { tier: number }) => (
    <span className="flex gap-1">
        {[1, 2, 3].map((level) => (
            <span
                key={level}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: level <= tier ? MEDALS[level].to : "var(--rule-strong)" }}
            />
        ))}
    </span>
);

export const PetAchievements = ({ achievements, rewards }: { achievements: Achievement[]; rewards: number[] }) => {
    const t = useTranslations("pet.achievements");
    const [selectedId, setSelectedId] = useState<AchievementId | null>(achievements[0]?.id ?? null);
    const selected = achievements.find((item) => item.id === selectedId) ?? achievements[0];

    const unlocked = achievements.reduce((sum, item) => sum + item.tier, 0);
    const total = achievements.length * 3;

    if (!selected) return null;

    const next = selected.targets[selected.tier];

    return (
        <div className="grid gap-5">
            <div className="bg-wash grid gap-4 rounded-2xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <AchievementMedal achievement={selected} size="lg" />
                    <div className="min-w-0">
                        <p className="label">{t(`tiers.${selected.tier}`)}</p>
                        <p className="font-display mt-1 text-2xl font-light tracking-tight">
                            {t(`items.${selected.id}.name`)}
                        </p>
                        <p className="text-ink-muted mt-1 text-sm leading-relaxed">{t(`items.${selected.id}.body`)}</p>
                        <p className="mt-3 font-mono text-sm tabular-nums">
                            {t(`items.${selected.id}.stat`, { value: selected.value })}
                            {next !== undefined && (
                                <span className="text-ink-faint">
                                    {" "}
                                    · {t("toNext", { left: next - selected.value })}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <ol className="border-rule grid border-t">
                    {selected.targets.map((target, index) => {
                        const reached = selected.tier > index;
                        return (
                            <li
                                key={target}
                                className={twMerge(
                                    "border-rule flex items-center gap-3 border-b py-2.5 last:border-b-0",
                                    !reached && "text-ink-faint",
                                )}
                            >
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: MEDALS[index + 1].to }}
                                />
                                <span className="min-w-0 flex-1 text-sm">{t(`tiers.${index + 1}`)}</span>
                                <span className="font-mono text-2xs tabular-nums">
                                    {t(`items.${selected.id}.stat`, { value: target })}
                                </span>
                                <span className="flex w-14 items-center justify-end gap-1 font-mono text-2xs tabular-nums">
                                    +{rewards[index] ?? 0}
                                    <Coin className="size-3" />
                                </span>
                                <span className="flex w-4 justify-end">
                                    {reached && <Check className="text-good size-4" />}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <div>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                    <p className="label">{t("all")}</p>
                    <p className="font-mono text-2xs tabular-nums">{t("progress", { unlocked, total })}</p>
                </div>
                <ul className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4">
                    {achievements.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={() => setSelectedId(item.id)}
                                aria-pressed={item.id === selected.id}
                                className={twMerge(
                                    "flex w-full flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors",
                                    item.id === selected.id ? "bg-wash" : "hover:bg-wash",
                                )}
                            >
                                <AchievementMedal achievement={item} />
                                <span className="line-clamp-2 text-center text-xs leading-tight font-medium">
                                    {t(`items.${item.id}.name`)}
                                </span>
                                <TierDots tier={item.tier} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
