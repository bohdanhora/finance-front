"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { useStreak } from "hooks/use-streak";
import { getStreakTier, toDayKey } from "lib/streak";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";

import { StreakMeter } from "./streak-meter";
import { StreakDetails } from "./streak-dialog";

export const StreakBadge = () => {
    const t = useTranslations("streak");
    const { record, reached, clearMilestone } = useStreak();

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!reached) return;

        toast.success(t("milestoneToast", { days: reached }));
        clearMilestone();
    }, [clearMilestone, reached, t]);

    if (!record) return null;

    const tier = getStreakTier(record.current);
    const visitedToday = record.history.includes(toDayKey());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    data-tour="streak"
                    aria-label={t("badgeLabel", { days: record.current })}
                    title={t("badgeLabel", { days: record.current })}
                    className="border-rule hover:border-rule-strong flex h-9 shrink-0 items-center gap-2 border px-2.5 transition-colors"
                >
                    <StreakMeter tier={tier.key} live={visitedToday} className="h-3.5" />
                    <span className="font-mono text-xs tabular-nums">{record.current}</span>
                </button>
            </DialogTrigger>

            <DialogContent>
                <StreakDetails record={record} />
            </DialogContent>
        </Dialog>
    );
};
