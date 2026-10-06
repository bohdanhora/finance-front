"use client";

import dayjs from "dayjs";
import { CheckCircle2, ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "components/ui/button";
import { CURRENCY } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { calculateSavingsPace, convertSavingsCurrency, getSavingsBalance, getUrlHost } from "lib/savings";
import { formatCurrency } from "lib/utils";
import { SavingsGoal, SavingsOperation } from "types/transactions";
import { SavingsPriceNote } from "./price-note";

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
            label: t("daily"),
            value: activePace ? money(activePace.dailyAmount, goal.currency) : "-",
        },
        { label: t("monthly"), value: money(monthlyContribution, goal.currency) },
        {
            label: t("targetDate"),
            value: goal.targetDate ? dayjs(goal.targetDate).format("DD.MM.YYYY") : t("noDeadline"),
        },
    ];
    const segments = 20;
    const filled = Math.round((progress / 100) * segments);

    return (
        <article className="border-rule-strong flex h-full flex-col border-t pt-4">
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-display min-w-0 pt-1 text-lg leading-tight font-medium tracking-tight break-words uppercase">
                    {goal.name}
                </h3>
                <div className="-mt-0.5 -mr-2 flex shrink-0 items-center">
                    <Button variant="ghost" size="icon" aria-label={t("editGoal")} onClick={() => onEdit(goal)}>
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("delete")}
                        className="hover:bg-signal-wash hover:text-signal"
                        onClick={() => onDelete(goal)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <p className="label">{t("targetAmount")}</p>
                    <p className="figure text-figure mt-1 break-words">{money(goal.targetAmount, goal.currency)}</p>
                    {convertedTarget !== null && (
                        <p className="text-ink-faint mt-1 font-mono text-2xs tabular-nums">
                            ≈ {money(convertedTarget, comparisonCurrency)}
                        </p>
                    )}
                </div>
                <p className={canAfford ? "figure text-accent text-3xl" : "figure text-3xl"}>
                    {Math.round(progress)}
                    <span className="text-ink-faint text-base">%</span>
                </p>
            </div>

            <div className="mt-3 flex h-2 gap-0.5" aria-hidden="true">
                {Array.from({ length: segments }, (_, index) => (
                    <span key={index} className={index < filled ? "bg-accent flex-1" : "bg-wash flex-1"} />
                ))}
            </div>

            <div className="mt-3 text-sm">
                {sharedSavings === null ? (
                    <p className="text-ink-faint">{t("ratesUnavailable")}</p>
                ) : canAfford ? (
                    <>
                        <p className="text-accent flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="size-4 shrink-0" />
                            {t("canAfford")}
                        </p>
                        <p className="text-ink-faint mt-0.5 text-xs">
                            {t("afterPurchase", { amount: money(afterPurchase, goal.currency) })}
                        </p>
                    </>
                ) : (
                    <>
                        <p className="font-medium">{t("stillNeeded", { amount: money(missing, goal.currency) })}</p>
                        <p className="text-ink-faint mt-0.5 text-xs">
                            {t("coveredBySavings", { amount: money(covered, goal.currency) })}
                        </p>
                    </>
                )}
            </div>

            <div className="border-rule mt-4 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-y py-2 text-xs">
                {goal.url ? (
                    <>
                        <a
                            href={goal.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="link flex max-w-full min-w-0 items-center gap-1.5"
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
                        className="text-ink-faint hover:text-accent flex items-center gap-1.5 transition-colors"
                    >
                        <Link2 className="size-3.5 shrink-0" />
                        {t("addLink")}
                    </button>
                )}
            </div>

            <dl className="divide-rule mt-auto grid grid-cols-3 divide-x pt-3">
                {tiles.map(({ label, value }) => (
                    <div key={label} className="min-w-0 px-3 first:pl-0">
                        <dt className="label">{label}</dt>
                        <dd className="mt-1 font-mono text-xs break-words tabular-nums">{value}</dd>
                    </div>
                ))}
            </dl>
        </article>
    );
};
