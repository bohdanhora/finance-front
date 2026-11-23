"use client";

import { CheckCircle2, Gift } from "lucide-react";
import { useTranslations } from "next-intl";

import { CURRENCY } from "constants/index";
import { goalLinks } from "lib/savings";
import { twMerge } from "lib/tw";
import { SavingsGoal, SavingsOperation } from "types/transactions";
import { SavingsGoalCover } from "./goal-cover";
import { GoalRates, getGoalSummary, goalMoney } from "./goal-summary";

type Props = {
    goal: SavingsGoal;
    operations: SavingsOperation[];
    rates: GoalRates;
    displayCurrency: CURRENCY;
    onOpen?: (goal: SavingsGoal) => void;
    handle?: React.ReactNode;
    className?: string;
};

export const SavingsGoalCard = ({ goal, operations, rates, displayCurrency, onOpen, handle, className }: Props) => {
    const t = useTranslations("savings");
    const summary = getGoalSummary(goal, operations, rates, displayCurrency);

    return (
        <article
            className={twMerge(
                "panel hover:border-rule-strong relative flex h-full flex-col overflow-hidden transition-colors",
                className,
            )}
        >
            <SavingsGoalCover
                links={goalLinks(goal)}
                image={goal.image}
                alt={goal.name}
                className="aspect-4/3"
                fallback={
                    <div className="bg-wash text-ink-faint flex aspect-4/3 items-center justify-center">
                        <Gift className="size-10 stroke-1" />
                    </div>
                }
            />

            <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display line-clamp-2 leading-tight font-medium tracking-tight break-words">
                    {goal.name}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <div className="min-w-0">
                        <p className="figure text-figure break-words">{goalMoney(goal.targetAmount, goal.currency)}</p>
                        {summary.convertedTarget !== null && (
                            <p className="text-ink-faint mt-1 font-mono text-2xs tabular-nums">
                                ≈ {goalMoney(summary.convertedTarget, summary.comparisonCurrency)}
                            </p>
                        )}
                    </div>
                    <p
                        className={twMerge(
                            "flex shrink-0 items-center gap-1 font-mono text-sm tabular-nums",
                            summary.canAfford ? "text-accent" : "text-ink-muted",
                        )}
                    >
                        {summary.canAfford && <CheckCircle2 className="size-4" />}
                        {Math.round(summary.progress)}%
                    </p>
                </div>

                <div className="bg-wash mt-3 h-1 overflow-hidden rounded-full" aria-hidden="true">
                    <div className="bg-accent h-full rounded-full" style={{ width: `${summary.progress}%` }} />
                </div>
            </div>

            {onOpen && (
                <button
                    type="button"
                    aria-label={t("openGoal", { name: goal.name })}
                    onClick={() => onOpen(goal)}
                    className="rounded-panel focus-visible:outline-accent absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2"
                />
            )}
            {handle && <div className="absolute top-3 left-3">{handle}</div>}
        </article>
    );
};
