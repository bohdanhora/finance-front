"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Lock, Trophy } from "lucide-react";

import { getIntlLocale } from "lib/date-locale";
import { STREAK_HISTORY_LENGTH, STREAK_TIERS, getRecentDays, getStreakGoal, getStreakTier, toDayKey } from "lib/streak";
import { StreakRecord } from "types/transactions";
import { DialogDescription, DialogHeader, DialogTitle } from "ui/dialog";

import { StreakFlame, TIER_PALETTE } from "./flame";

/** Hex accents are tinted by appending an alpha pair rather than duplicating them. */
const alpha = (hex: string, suffix: string) => `${hex}${suffix}`;

export const StreakDetails = ({ record, symbol }: { record: StreakRecord; symbol: string }) => {
    const t = useTranslations("streak");
    const locale = useLocale();

    const today = toDayKey();
    const tier = getStreakTier(record.current);
    const goal = getStreakGoal(record.current);
    const palette = TIER_PALETTE[tier.key];
    const days = getRecentDays(record, today);

    const weekday = new Intl.DateTimeFormat(getIntlLocale(locale), { weekday: "narrow" });

    return (
        <>
            <DialogHeader>
                <DialogTitle>{t("title")}</DialogTitle>
                <DialogDescription>{t("subtitle")}</DialogDescription>
            </DialogHeader>

            <div
                className="relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 sm:p-5"
                style={{
                    borderColor: alpha(palette.accent, "40"),
                    background: `linear-gradient(135deg, ${alpha(palette.accent, "1f")}, transparent 70%)`,
                }}
            >
                <StreakFlame tier={tier.key} size={64} symbol={symbol} />

                <div className="min-w-0">
                    <p className="text-3xl leading-none font-semibold tabular-nums">
                        {t("daysInARow", { days: record.current })}
                    </p>
                    <p
                        className="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide uppercase"
                        style={{ backgroundColor: alpha(palette.accent, "24"), color: palette.accent }}
                    >
                        {t(`tiers.${tier.key}.name`)}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t(`tiers.${tier.key}.body`)}</p>
                </div>
            </div>

            <div>
                <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-muted-foreground font-medium">
                        {goal ? t("nextTier", { days: goal.target }) : t("topTier")}
                    </span>
                    {goal && (
                        <span className="font-semibold tabular-nums">{t("daysLeft", { days: goal.daysLeft })}</span>
                    )}
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                            width: `${Math.round((goal?.progress ?? 1) * 100)}%`,
                            background: `linear-gradient(90deg, ${alpha(palette.accent, "99")}, ${palette.accent})`,
                        }}
                    />
                </div>
            </div>

            <div>
                <p className="text-muted-foreground mb-2 text-[0.7rem] font-semibold tracking-[0.12em] uppercase">
                    {t("lastWeek")}
                </p>
                <div className="grid grid-cols-7 gap-1.5">
                    {days.map((day) => (
                        <div key={day.key} className="flex flex-col items-center gap-1.5">
                            <span className="text-muted-foreground text-[0.65rem] font-medium uppercase">
                                {weekday.format(new Date(`${day.key}T00:00:00`))}
                            </span>
                            <span
                                className="flex h-8 w-full items-center justify-center rounded-lg border text-[0.65rem]"
                                style={{
                                    borderColor: day.isToday ? palette.accent : "var(--border)",
                                    backgroundColor: day.visited ? alpha(palette.accent, "26") : "transparent",
                                    color: palette.accent,
                                }}
                            >
                                {day.visited ? (
                                    <Check className="size-3.5" strokeWidth={3} />
                                ) : (
                                    <span className="bg-muted-foreground/25 size-1.5 rounded-full" />
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="border-border bg-card rounded-2xl border p-3.5">
                    <p className="text-muted-foreground flex items-center gap-1.5 text-[0.7rem] font-medium tracking-wide uppercase">
                        <Trophy className="size-3.5" />
                        {t("best")}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{t("daysShort", { days: record.best })}</p>
                </div>
                <div className="border-border bg-card rounded-2xl border p-3.5">
                    <p className="text-muted-foreground text-[0.7rem] font-medium tracking-wide uppercase">
                        {t("tracked", { window: STREAK_HISTORY_LENGTH })}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                        {t("daysShort", { days: record.history.length })}
                    </p>
                </div>
            </div>

            <div className="border-border overflow-hidden rounded-2xl border">
                {STREAK_TIERS.filter((item) => item.from > 0).map((item, index) => {
                    const reached = record.current >= item.from;
                    const isCurrent = item.key === tier.key;

                    return (
                        <div
                            key={item.key}
                            className={`flex items-center gap-3 px-3.5 py-2.5 ${index > 0 ? "border-border/70 border-t" : ""}`}
                            style={
                                isCurrent ? { backgroundColor: alpha(TIER_PALETTE[item.key].accent, "14") } : undefined
                            }
                        >
                            <StreakFlame tier={reached ? item.key : "dormant"} size={20} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{t(`tiers.${item.key}.name`)}</p>
                                <p className="text-muted-foreground text-xs">{t("fromDays", { days: item.from })}</p>
                            </div>
                            {reached ? (
                                <Check className="size-4" style={{ color: TIER_PALETTE[item.key].accent }} />
                            ) : (
                                <Lock className="text-muted-foreground/60 size-3.5" />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};
