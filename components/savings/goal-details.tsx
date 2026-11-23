"use client";

import { CheckCircle2, ExternalLink, Link2, NotebookPen, Pencil, Trash2, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "components/ui/dialog";
import { CURRENCY } from "constants/index";
import { getUrlHost, goalLinks } from "lib/savings";
import { twMerge } from "lib/tw";
import { SavingsGoal, SavingsOperation } from "types/transactions";
import { SavingsGoalCover } from "./goal-cover";
import { GoalRates, getGoalSummary, goalMoney } from "./goal-summary";
import { SavingsPriceNote } from "./price-note";

type Props = {
    goal: SavingsGoal | null;
    operations: SavingsOperation[];
    rates: GoalRates;
    displayCurrency: CURRENCY;
    onOpenChange: (open: boolean) => void;
    onEdit: (goal: SavingsGoal) => void;
    onDelete: (goal: SavingsGoal) => void;
};

const SEGMENTS = 20;

export const SavingsGoalDetails = ({
    goal,
    operations,
    rates,
    displayCurrency,
    onOpenChange,
    onEdit,
    onDelete,
}: Props) => (
    <Dialog open={Boolean(goal)} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false}>
            {goal && (
                <GoalDetailsBody
                    goal={goal}
                    operations={operations}
                    rates={rates}
                    displayCurrency={displayCurrency}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )}
        </DialogContent>
    </Dialog>
);

const GoalDetailsBody = ({
    goal,
    operations,
    rates,
    displayCurrency,
    onEdit,
    onDelete,
}: Omit<Props, "goal" | "onOpenChange"> & { goal: SavingsGoal }) => {
    const t = useTranslations("savings");
    const links = goalLinks(goal);
    const summary = getGoalSummary(goal, operations, rates, displayCurrency);
    const filled = Math.round((summary.progress / 100) * SEGMENTS);

    const tiles = [
        {
            label: t("daily"),
            value: summary.activePace ? goalMoney(summary.activePace.dailyAmount, goal.currency) : "-",
        },
        { label: t("monthly"), value: goalMoney(summary.monthlyContribution, goal.currency) },
        { label: t("targetDate"), value: summary.targetDate ?? t("noDeadline") },
    ];

    return (
        <>
            <div className="relative -mx-4 -mt-5 sm:-mx-6 sm:-mt-6">
                <SavingsGoalCover
                    links={links}
                    image={goal.image}
                    alt={goal.name}
                    className="h-64 rounded-t-3xl sm:h-72"
                    fallback={<div className="h-14" />}
                />
                <DialogClose className="bg-surface/80 text-ink-muted hover:text-ink absolute top-4 right-4 flex size-8 cursor-pointer items-center justify-center rounded-full backdrop-blur transition-colors">
                    <XIcon className="size-4" />
                    <span className="sr-only">{t("cancel")}</span>
                </DialogClose>
            </div>

            <div className="min-w-0">
                <DialogTitle className="font-display text-xl leading-tight font-medium tracking-tight break-words">
                    {goal.name}
                </DialogTitle>
                <DialogDescription className="sr-only">{t("goalDialogHint")}</DialogDescription>
            </div>

            <div>
                <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="label">{t("targetAmount")}</p>
                        <p className="figure text-figure mt-1 break-words">
                            {goalMoney(goal.targetAmount, goal.currency)}
                        </p>
                        {summary.convertedTarget !== null && (
                            <p className="text-ink-faint mt-1 font-mono text-2xs tabular-nums">
                                ≈ {goalMoney(summary.convertedTarget, summary.comparisonCurrency)}
                            </p>
                        )}
                    </div>
                    <p
                        className={
                            summary.canAfford
                                ? "figure figure-light text-accent glow-text text-4xl"
                                : "figure figure-light text-4xl"
                        }
                    >
                        {Math.round(summary.progress)}
                        <span className="text-ink-faint text-base">%</span>
                    </p>
                </div>

                <div className="mt-3 flex h-2 gap-1" aria-hidden="true">
                    {Array.from({ length: SEGMENTS }, (_, index) => (
                        <span
                            key={index}
                            className={twMerge("flex-1 rounded-full", index < filled ? "bg-accent" : "bg-wash")}
                        />
                    ))}
                </div>

                <div className="mt-3 text-sm">
                    {!summary.ratesAvailable ? (
                        <p className="text-ink-faint">{t("ratesUnavailable")}</p>
                    ) : summary.canAfford ? (
                        <>
                            <p className="text-accent flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="size-4 shrink-0" />
                                {t("canAfford")}
                            </p>
                            <p className="text-ink-faint mt-0.5 text-xs">
                                {t("afterPurchase", { amount: goalMoney(summary.afterPurchase, goal.currency) })}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-medium">
                                {t("stillNeeded", { amount: goalMoney(summary.missing, goal.currency) })}
                            </p>
                            <p className="text-ink-faint mt-0.5 text-xs">
                                {t("coveredBySavings", { amount: goalMoney(summary.covered, goal.currency) })}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {links.length > 0 ? (
                <ul className="border-rule divide-rule divide-y border-y text-xs">
                    {links.map((url) => (
                        <li
                            key={url}
                            className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2"
                        >
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="link flex max-w-full min-w-0 items-center gap-1.5"
                            >
                                <ExternalLink className="size-3.5 shrink-0" />
                                <span className="truncate">{getUrlHost(url)}</span>
                            </a>
                            <SavingsPriceNote goal={goal} url={url} rates={rates} className="mt-0" />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="border-rule flex min-h-10 items-center border-y py-2 text-xs">
                    <button
                        type="button"
                        onClick={() => onEdit(goal)}
                        className="text-ink-faint hover:text-accent flex items-center gap-1.5 transition-colors"
                    >
                        <Link2 className="size-3.5 shrink-0" />
                        {t("addLink")}
                    </button>
                </div>
            )}

            {goal.note && (
                <p className="text-ink-muted flex gap-2 text-sm">
                    <NotebookPen className="text-ink-faint mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0 break-words whitespace-pre-line">{goal.note}</span>
                </p>
            )}

            <dl className="divide-rule grid grid-cols-3 divide-x">
                {tiles.map(({ label, value }) => (
                    <div key={label} className="min-w-0 px-3 first:pl-0">
                        <dt className="label">{label}</dt>
                        <dd className="mt-1 font-mono text-xs break-words tabular-nums">{value}</dd>
                    </div>
                ))}
            </dl>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                    type="button"
                    variant="ghost"
                    className="hover:bg-signal-wash hover:text-signal"
                    onClick={() => onDelete(goal)}
                >
                    <Trash2 />
                    {t("delete")}
                </Button>
                <Button type="button" onClick={() => onEdit(goal)}>
                    <Pencil />
                    {t("editGoal")}
                </Button>
            </div>
        </>
    );
};
