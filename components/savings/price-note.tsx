"use client";

import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Loader2, Tag } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useSavingsGoalPrice } from "api/main";
import { CURRENCY } from "constants/index";
import { convertSavingsCurrency } from "lib/savings";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency } from "lib/utils";
import { SavingsGoal } from "types/transactions";

type Props = {
    goal: SavingsGoal;
    rates: { usdToUah: number; eurToUah: number };
};

const KNOWN_CURRENCIES: Record<string, CURRENCY> = {
    UAH: CURRENCY.UAH,
    USD: CURRENCY.USD,
    EUR: CURRENCY.EUR,
};

/** Prices from a shop are rarely exact to the cent, so ignore tiny gaps. */
const MEANINGFUL_DIFFERENCE = 0.5;

export const SavingsPriceNote = ({ goal, rates }: Props) => {
    const t = useTranslations("savings");
    const { data, isFetching, isError } = useSavingsGoalPrice(goal.url);

    if (!goal.url) return null;

    if (isFetching && !data) {
        return (
            <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                <Loader2 className="size-3 animate-spin" />
                {t("priceChecking")}
            </p>
        );
    }

    if (isError || !data || data.price === null) {
        return <p className="text-muted-foreground mt-1.5 text-xs">{t("priceUnavailable")}</p>;
    }

    const siteCurrency = data.currency ? KNOWN_CURRENCIES[data.currency.toUpperCase()] : undefined;
    const sitePrice = siteCurrency
        ? `${formatCurrency(data.price)} ${getCurrencySymbol(siteCurrency)}`
        : `${formatCurrency(data.price)}${data.currency ? ` ${data.currency}` : ""}`;
    const comparable = siteCurrency ? convertSavingsCurrency(data.price, siteCurrency, goal.currency, rates) : null;
    const difference = comparable === null ? null : comparable - goal.targetAmount;
    const isCheaper = difference !== null && difference < -MEANINGFUL_DIFFERENCE;
    const isPricier = difference !== null && difference > MEANINGFUL_DIFFERENCE;
    const gap =
        difference === null ? "" : `${formatCurrency(Math.abs(difference))} ${getCurrencySymbol(goal.currency)}`;

    return (
        <p
            className={twMerge(
                "mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs",
                isCheaper
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isPricier
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
            )}
        >
            <span className="flex items-center gap-1.5 tabular-nums">
                {isCheaper ? (
                    <ArrowDownRight className="size-3.5" />
                ) : isPricier ? (
                    <ArrowUpRight className="size-3.5" />
                ) : (
                    <Tag className="size-3.5" />
                )}
                {t("priceOnSite", { amount: sitePrice })}
            </span>
            {difference !== null && (
                <span>
                    {isCheaper
                        ? t("priceCheaper", { amount: gap })
                        : isPricier
                          ? t("pricePricier", { amount: gap })
                          : t("priceMatches")}
                </span>
            )}
        </p>
    );
};
