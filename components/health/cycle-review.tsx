"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";
import { XIcon } from "lucide-react";

import { getCategoryLabel } from "constants/categories";
import { cycleReview } from "lib/health";
import { PayCycle } from "lib/pay-cycle";
import { formatCurrency, formatSignedCurrency } from "lib/utils";
import { useStatisticsPreferences } from "hooks/use-statistics-preferences";
import { TransactionType } from "types/transactions";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "ui/dialog";

const DISMISS_KEY = "finance:cycle-review-seen";
const FRESH_DAYS = 5;

const readSeen = () => {
    try {
        return window.localStorage.getItem(DISMISS_KEY);
    } catch {
        return null;
    }
};

const writeSeen = (value: string) => {
    try {
        window.localStorage.setItem(DISMISS_KEY, value);
    } catch {}
};

export const useCycleReview = (cycle: PayCycle, transactions: TransactionType[]) => {
    const preferences = useStatisticsPreferences();
    const period = useMemo(() => {
        const length = cycle.end.diff(cycle.start, "month") || 1;
        const start = cycle.start.subtract(length, "month");
        return { start, end: cycle.start, previous: { start: start.subtract(length, "month"), end: start } };
    }, [cycle.start, cycle.end]);

    const review = useMemo(
        () =>
            cycleReview({
                transactions,
                period: { start: period.start, end: period.end },
                previous: period.previous,
                limits: preferences.limits,
            }),
        [transactions, period, preferences.limits],
    );

    return { review, period };
};

export const CycleReview = ({
    cycle,
    transactions,
    symbol,
    open,
    onOpenChange,
}: {
    cycle: PayCycle;
    transactions: TransactionType[];
    symbol: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const t = useTranslations("health.review");
    const tCategories = useTranslations("categories");
    const { review, period } = useCycleReview(cycle, transactions);
    const money = (value: number) => `${formatSignedCurrency(value)} ${symbol}`;
    const range = `${period.start.format("DD.MM")} - ${period.end.subtract(1, "day").format("DD.MM")}`;
    const hasData = review.income > 0 || review.spending > 0;

    const rows = [
        { key: "income", label: t("income"), value: review.income, tone: "text-good" },
        { key: "spending", label: t("spending"), value: -review.spending, tone: "" },
        { key: "saved", label: t("saved"), value: review.saved, tone: "text-accent" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description", { range })}</DialogDescription>
                </DialogHeader>

                {!hasData ? (
                    <p className="text-ink-faint text-sm">{t("empty")}</p>
                ) : (
                    <div className="space-y-5">
                        <dl className="border-rule border-t">
                            {rows.map((row) => (
                                <div
                                    key={row.key}
                                    className="border-rule flex items-baseline justify-between gap-4 border-b py-2"
                                >
                                    <dt className="text-ink-muted text-sm">{row.label}</dt>
                                    <dd className={twMerge("font-mono text-xs tabular-nums", row.tone)}>
                                        {money(row.value)}
                                    </dd>
                                </div>
                            ))}
                            <div className="flex items-baseline justify-between gap-4 py-2.5">
                                <dt className="text-sm font-medium">{t("kept")}</dt>
                                <dd
                                    className={twMerge(
                                        "font-mono text-sm tabular-nums",
                                        review.kept < 0 ? "text-signal" : "text-good",
                                    )}
                                >
                                    {money(review.kept)}
                                    {review.income > 0 && ` · ${Math.round(review.keptShare * 100)}%`}
                                </dd>
                            </div>
                        </dl>

                        <p className="text-sm">
                            {review.kept < 0
                                ? t("verdictLoss")
                                : review.keptShare >= 0.2
                                  ? t("verdictGreat")
                                  : review.keptShare >= 0.1
                                    ? t("verdictGood")
                                    : t("verdictThin")}
                        </p>

                        {review.spendingChange !== null && (
                            <p className="text-ink-muted text-sm">
                                {t(review.spendingChange > 0 ? "spentMore" : "spentLess", {
                                    percent: Math.abs(Math.round(review.spendingChange * 100)),
                                    amount: `${formatCurrency(Math.abs(review.spending - review.previousSpending))} ${symbol}`,
                                })}
                            </p>
                        )}

                        {review.grew.length > 0 && (
                            <div>
                                <p className="label mb-1.5">{t("grew")}</p>
                                <ul className="space-y-1 text-sm">
                                    {review.grew.map((item) => (
                                        <li key={item.category} className="flex justify-between gap-4">
                                            <span className="min-w-0 truncate">
                                                {getCategoryLabel(item.category, tCategories)}
                                            </span>
                                            <span className="text-warn shrink-0 font-mono text-xs tabular-nums">
                                                +{formatCurrency(item.change)} {symbol}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {review.overLimits.length > 0 && (
                            <div>
                                <p className="label mb-1.5">{t("overLimits")}</p>
                                <ul className="space-y-1 text-sm">
                                    {review.overLimits.map((item) => (
                                        <li key={item.category} className="flex justify-between gap-4">
                                            <span className="min-w-0 truncate">
                                                {getCategoryLabel(item.category, tCategories)}
                                            </span>
                                            <span className="text-signal shrink-0 font-mono text-xs tabular-nums">
                                                {formatCurrency(item.spent)} / {formatCurrency(item.limit)} {symbol}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export const CycleReviewBanner = ({
    cycle,
    transactions,
    symbol,
    onOpen,
}: {
    cycle: PayCycle;
    transactions: TransactionType[];
    symbol: string;
    onOpen: () => void;
}) => {
    const t = useTranslations("health.review");
    const [seen, setSeen] = useState<string | null>("pending");
    const key = cycle.start.format("YYYY-MM-DD");
    const { review } = useCycleReview(cycle, transactions);

    useEffect(() => setSeen(readSeen()), []);

    const dismiss = () => {
        writeSeen(key);
        setSeen(key);
    };

    if (!cycle.anchored || cycle.daysElapsed > FRESH_DAYS || seen === key || seen === "pending") return null;
    if (review.income <= 0 && review.spending <= 0) return null;

    return (
        <div className="rounded-panel border-accent/40 bg-surface mb-3 flex items-center gap-3 border p-3 sm:p-4">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t("bannerTitle")}</p>
                <p className="text-ink-muted text-xs">
                    {t("bannerText", { amount: `${formatSignedCurrency(review.kept)} ${symbol}` })}
                </p>
            </div>
            <Button
                size="sm"
                onClick={() => {
                    dismiss();
                    onOpen();
                }}
            >
                {t("open")}
            </Button>
            <Button variant="ghost" size="icon" aria-label={t("dismiss")} onClick={dismiss}>
                <XIcon className="size-4" />
            </Button>
        </div>
    );
};
