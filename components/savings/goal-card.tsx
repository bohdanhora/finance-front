"use client";

import dayjs from "dayjs";
import {
    ArrowDownToLine,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ExternalLink,
    Link2,
    Pencil,
    Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "components/ui/button";
import { CURRENCY } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { calculateSavingsPace, convertSavingsCurrency, getSavingsBalance, getUrlHost } from "lib/savings";
import { formatCurrency } from "lib/utils";
import { SavingsGoal, SavingsOperation } from "types/transactions";
import { SavingsPriceNote } from "./price-note";
import { ProgressRing } from "./progress-ring";

type Props = {
    goal: SavingsGoal;
    operations: SavingsOperation[];
    rates: { usdToUah: number; eurToUah: number };
    displayCurrency: CURRENCY;
    onEdit: (goal: SavingsGoal) => void;
    onDelete: (goal: SavingsGoal) => void;
};

const money = (value: number, currency: CURRENCY) => `${formatCurrency(value)} ${getCurrencySymbol(currency)}`;

export const SavingsGoalCard = ({ goal, operations, rates, displayCurrency, onEdit, onDelete }: Props) => {
    const t = useTranslations("savings");

    const sharedSavings = getSavingsBalance(operations, goal.currency, rates);
    const saved = Math.max(sharedSavings ?? 0, 0);
    const covered = Math.min(saved, goal.targetAmount);
    const missing = Math.max(goal.targetAmount - saved, 0);
    const afterPurchase = Math.max(saved - goal.targetAmount, 0);
    const canAfford = sharedSavings !== null && saved >= goal.targetAmount;
    const savingsPace = calculateSavingsPace(missing, goal.targetDate);
    const activePace = savingsPace && !savingsPace.isOverdue ? savingsPace : null;
    const monthlyContribution = activePace ? activePace.monthlyAmount : goal.monthlyContribution;
    const progress = goal.targetAmount > 0 ? Math.min((covered / goal.targetAmount) * 100, 100) : 0;
    const comparisonCurrency =
        goal.currency === CURRENCY.UAH
            ? displayCurrency === CURRENCY.UAH
                ? CURRENCY.USD
                : displayCurrency
            : CURRENCY.UAH;
    const convertedTarget = convertSavingsCurrency(goal.targetAmount, goal.currency, comparisonCurrency, rates);

    const tiles = [
        {
            icon: CalendarDays,
            label: t("daily"),
            value: activePace ? money(activePace.dailyAmount, goal.currency) : "-",
        },
        { icon: ArrowDownToLine, label: t("monthly"), value: money(monthlyContribution, goal.currency) },
        {
            icon: CalendarClock,
            label: t("targetDate"),
            value: goal.targetDate ? dayjs(goal.targetDate).format("DD.MM.YYYY") : t("noDeadline"),
        },
    ];

    return (
        <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 truncate pt-1.5 font-semibold">{goal.name}</h3>
                <div className="-mt-0.5 -mr-2 flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label={t("editGoal")} onClick={() => onEdit(goal)}>
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("delete")}
                        className="hover:bg-rose-500/10 hover:text-rose-500"
                        onClick={() => onDelete(goal)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-5">
                <ProgressRing value={progress} complete={canAfford} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">
                        {money(goal.targetAmount, goal.currency)}
                    </p>
                    {convertedTarget !== null && (
                        <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                            ≈ {money(convertedTarget, comparisonCurrency)}
                        </p>
                    )}
                    {sharedSavings === null ? (
                        <p className="text-muted-foreground mt-3 text-sm">{t("ratesUnavailable")}</p>
                    ) : canAfford ? (
                        <>
                            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-4 shrink-0" />
                                {t("canAfford")}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                {t("afterPurchase", { amount: money(afterPurchase, goal.currency) })}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="mt-3 text-sm font-medium">
                                {t("stillNeeded", { amount: money(missing, goal.currency) })}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                {t("coveredBySavings", { amount: money(covered, goal.currency) })}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-muted/40 mt-4 flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-xs">
                {goal.url ? (
                    <>
                        <a
                            href={goal.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-foreground/80 hover:text-foreground flex max-w-full min-w-0 items-center gap-1.5 font-medium underline-offset-2 hover:underline"
                        >
                            <ExternalLink className="size-3.5 shrink-0" />
                            <span className="truncate">{getUrlHost(goal.url)}</span>
                        </a>
                        <SavingsPriceNote goal={goal} rates={rates} className="mt-0" />
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => onEdit(goal)}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                        <Link2 className="size-3.5 shrink-0" />
                        {t("addLink")}
                    </button>
                )}
            </div>

            <dl className="mt-auto grid grid-cols-3 gap-2 pt-4">
                {tiles.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="border-border/60 min-w-0 rounded-xl border px-3 py-2.5">
                        <dt className="text-muted-foreground flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wide uppercase">
                            <Icon className="size-3 shrink-0" />
                            <span className="truncate">{label}</span>
                        </dt>
                        <dd className="mt-1 truncate text-sm font-semibold tabular-nums" title={value}>
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </article>
    );
};
