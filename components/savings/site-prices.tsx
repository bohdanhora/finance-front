"use client";

import { ArrowDownRight, ArrowUpRight, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

import { useSavingsGoalPrices } from "api/main";
import { twMerge } from "lib/tw";
import { SavingsGoal } from "types/transactions";
import { GoalRates, goalMoney } from "./goal-summary";
import { MEANINGFUL_PRICE_DIFFERENCE, formatSitePrice, sitePriceIn } from "./site-price";

type Props = {
    goal: SavingsGoal;
    links: string[];
    rates: GoalRates;
    className?: string;
};

export const SavingsSitePrices = ({ goal, links, rates, className }: Props) => {
    const t = useTranslations("savings");
    const queries = useSavingsGoalPrices(links);

    const found = queries
        .map(({ data }) => data)
        .filter((data): data is NonNullable<typeof data> => Boolean(data) && data?.price !== null);
    if (!found.length) return null;

    const comparable = found
        .map((data) => sitePriceIn(data, goal.currency, rates))
        .filter((value): value is number => value !== null);

    if (!comparable.length) {
        return (
            <p className={twMerge("text-ink-faint flex items-center gap-1.5 text-xs tabular-nums", className)}>
                <Tag className="size-3.5 shrink-0" />
                <span className="truncate">
                    {t("priceOnSite", { amount: formatSitePrice(found[0].price as number, found[0].currency) })}
                </span>
            </p>
        );
    }

    const min = Math.min(...comparable);
    const max = Math.max(...comparable);
    const isCheaper = min < goal.targetAmount - MEANINGFUL_PRICE_DIFFERENCE;
    const isPricier = min > goal.targetAmount + MEANINGFUL_PRICE_DIFFERENCE;
    const spread = max - min > MEANINGFUL_PRICE_DIFFERENCE;
    const text = spread
        ? t("sitePricesRange", {
              count: comparable.length,
              min: goalMoney(min, goal.currency),
              max: goalMoney(max, goal.currency),
          })
        : comparable.length > 1
          ? t("sitePricesSame", { count: comparable.length, amount: goalMoney(min, goal.currency) })
          : t("priceOnSite", { amount: goalMoney(min, goal.currency) });

    return (
        <p
            className={twMerge(
                "flex items-center gap-1.5 text-xs tabular-nums",
                isCheaper ? "text-good" : isPricier ? "text-signal" : "text-ink-faint",
                className,
            )}
        >
            {isCheaper ? (
                <ArrowDownRight className="size-3.5 shrink-0" />
            ) : isPricier ? (
                <ArrowUpRight className="size-3.5 shrink-0" />
            ) : (
                <Tag className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{text}</span>
        </p>
    );
};
