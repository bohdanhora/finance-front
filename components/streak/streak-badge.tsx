"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { useStreak } from "hooks/use-streak";
import { getCurrencySymbol } from "lib/currency";
import { getStreakTier } from "lib/streak";
import useStore from "store/general";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";

import { StreakFlame } from "./flame";
import { StreakDetails } from "./streak-dialog";

/**
 * The navbar counter: how many days in a row the app has been opened, with a
 * flame that changes at ten, fifty and a hundred days. Tapping it opens the
 * whole picture.
 */
export const StreakBadge = () => {
    const t = useTranslations("streak");
    const { record, reached, clearMilestone } = useStreak();
    const userCurrency = useStore((state) => state.userCurrency);

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!reached) return;

        toast.success(t("milestoneToast", { days: reached }));
        clearMilestone();
    }, [clearMilestone, reached, t]);

    // Nothing is known until the record is read on the client, and rendering a
    // guess would not survive hydration.
    if (!record) return null;

    const tier = getStreakTier(record.current);
    const symbol = getCurrencySymbol(userCurrency);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    data-tour="streak"
                    aria-label={t("badgeLabel", { days: record.current })}
                    title={t("badgeLabel", { days: record.current })}
                    // A phone navbar has no room for another bordered chip, so below
                    // `sm` the flame and the count stand on their own.
                    className="sm:border-border/70 flex h-9 shrink-0 cursor-pointer items-center gap-0.5 rounded-2xl px-0.5 transition-colors hover:bg-black/[0.04] sm:gap-1 sm:border sm:bg-card/65 sm:py-0.5 sm:pr-2 sm:pl-1 sm:shadow-sm sm:shadow-black/5 sm:ring-1 sm:ring-white/40 dark:hover:bg-white/[0.06] dark:sm:ring-white/5"
                >
                    <StreakFlame tier={tier.key} size={18} symbol={symbol} />
                    <span className="text-xs font-bold tabular-nums sm:text-sm">{record.current}</span>
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <StreakDetails record={record} symbol={symbol} />
            </DialogContent>
        </Dialog>
    );
};
