"use client";

import { useLocale, useTranslations } from "next-intl";

import { twMerge } from "lib/tw";
import { getIntlLocale } from "lib/date-locale";
import { STREAK_HISTORY_LENGTH, STREAK_TIERS, getRecentDays, getStreakGoal, getStreakTier, toDayKey } from "lib/streak";
import { StreakRecord } from "types/transactions";
import { DialogDescription, DialogHeader, DialogTitle } from "ui/dialog";

import { StreakMeter } from "./streak-meter";

export const StreakDetails = ({ record }: { record: StreakRecord }) => {
    const t = useTranslations("streak");
    const locale = useLocale();

    const today = toDayKey();
    const tier = getStreakTier(record.current);
    const goal = getStreakGoal(record.current);
    const days = getRecentDays(record, today);
    const progress = Math.round((goal?.progress ?? 1) * 100);

    const weekday = new Intl.DateTimeFormat(getIntlLocale(locale), { weekday: "short" });

    return (
        <>
            <DialogHeader>
                <DialogTitle>{t("title")}</DialogTitle>
                <DialogDescription>{t("subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <p className="label">{t(`tiers.${tier.key}.name`)}</p>
                    <p className="figure text-hero mt-2">
                        {record.current}
                        <span className="caret caret-blink" aria-hidden="true" />
                    </p>
                    <p className="text-ink-muted mt-2 text-sm">{t("daysInARow", { days: record.current })}</p>
                </div>
                <StreakMeter tier={tier.key} className="h-14 gap-1" cellClassName="w-3" />
            </div>

            <p className="text-ink-muted text-sm leading-relaxed">{t(`tiers.${tier.key}.body`)}</p>

            <div>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="label">{goal ? t("nextTier", { days: goal.target }) : t("topTier")}</span>
                    {goal && (
                        <span className="font-mono text-2xs tabular-nums">
                            {t("daysLeft", { days: goal.daysLeft })}
                        </span>
                    )}
                </div>
                <div className="bg-wash h-1.5 w-full">
                    <div
                        className="bg-accent h-full transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div>
                <p className="label mb-2">{t("lastWeek")}</p>
                <div className="border-rule grid grid-cols-7 border-t border-l">
                    {days.map((day) => (
                        <div
                            key={day.key}
                            className={twMerge(
                                "border-rule flex flex-col items-center gap-2 border-r border-b py-2.5",
                                day.isToday && "bg-surface",
                            )}
                        >
                            <span className={twMerge("label text-3xs", day.isToday && "text-ink")}>
                                {weekday.format(new Date(`${day.key}T00:00:00`))}
                            </span>
                            <span className={twMerge("size-3", day.visited ? "bg-accent" : "border-rule border")} />
                        </div>
                    ))}
                </div>
            </div>

            <dl className="border-rule-strong border-t">
                <div className="border-rule flex justify-between gap-4 border-b py-2.5">
                    <dt className="label">{t("best")}</dt>
                    <dd className="font-mono text-xs tabular-nums">{t("daysShort", { days: record.best })}</dd>
                </div>
                <div className="border-rule flex justify-between gap-4 border-b py-2.5">
                    <dt className="label">{t("tracked", { window: STREAK_HISTORY_LENGTH })}</dt>
                    <dd className="font-mono text-xs tabular-nums">
                        {t("daysShort", { days: record.history.length })}
                    </dd>
                </div>
            </dl>

            <ol className="border-rule-strong border-t">
                {STREAK_TIERS.filter((item) => item.from > 0).map((item, index) => {
                    const reached = record.current >= item.from;
                    const isCurrent = item.key === tier.key;

                    return (
                        <li
                            key={item.key}
                            className={twMerge(
                                "border-rule flex items-center gap-3 border-b py-2.5",
                                !reached && "text-ink-faint",
                            )}
                        >
                            <span className={twMerge("w-6 font-mono text-2xs", isCurrent && "text-accent")}>
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 flex-1 text-sm font-medium">{t(`tiers.${item.key}.name`)}</span>
                            <span className="font-mono text-2xs tabular-nums">
                                {t("fromDays", { days: item.from })}
                            </span>
                            <span className={twMerge("size-2", reached ? "bg-accent" : "border-rule border")} />
                        </li>
                    );
                })}
            </ol>
        </>
    );
};
