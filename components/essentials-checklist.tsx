"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { EssentialsType } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency } from "lib/utils";
import useStore from "store/general";
import { EssentialType } from "types/transactions";
import { AnimatedMoney } from "./animated-number";
import { EssentialPaymentDialog } from "./dialogs/essential-payment";
import { Checkbox } from "./ui/checkbox";

/**
 * Ticking off a paid bill is the most frequent action in the app, so it lives
 * on the dashboard rather than behind a dialog. Unchecked items are the ones
 * still owed, which is what every "after essentials" figure is based on.
 */
export const EssentialsChecklist = ({ nextMonth = false }: { nextMonth?: boolean }) => {
    const t = useTranslations("possible");
    const store = useStore();
    const [selectedEssential, setSelectedEssential] = useState<EssentialType | null>(null);

    const items = nextMonth ? store.nextMonthEssentialsArray : store.essentialsArray;
    const symbol = getCurrencySymbol(store.userCurrency);

    if (!items.length) {
        return (
            <p className="border-border text-muted-foreground rounded-2xl border border-dashed p-5 text-center text-sm">
                {t("noEssentials")}
            </p>
        );
    }

    const paidCount = items.filter((item) => item.checked).length;
    const outstanding = items.reduce((sum, item) => (item.checked ? sum : sum + item.amount), 0);
    const progress = Math.round((paidCount / items.length) * 100);

    const type = nextMonth ? EssentialsType.NEXT_MONTH : EssentialsType.THIS_MONTH;

    return (
        <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-muted-foreground text-[0.7rem] font-medium tracking-wide uppercase">
                    {t("essentialsProgress", { paid: paidCount, total: items.length })}
                </p>
                <p className="text-sm font-medium tabular-nums">
                    {outstanding > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                            {t("stillToPay")}: <AnimatedMoney value={outstanding} symbol={symbol} />
                        </span>
                    ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">{t("allPaid")}</span>
                    )}
                </p>
            </div>

            <div className="bg-muted mb-4 h-1.5 w-full overflow-hidden rounded-full">
                <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <ul className="flex flex-col">
                {items.map((item) => (
                    <li key={item.id}>
                        <label
                            className={twMerge(
                                "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors",
                                "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                            )}
                        >
                            <Checkbox
                                checked={item.checked}
                                onCheckedChange={() => setSelectedEssential(item)}
                                className="size-4 shrink-0 rounded-[5px] data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                            />
                            <span
                                className={twMerge(
                                    "min-w-0 flex-1 truncate text-sm transition-colors",
                                    item.checked && "text-muted-foreground line-through",
                                )}
                            >
                                {item.title}
                            </span>
                            <span className="shrink-0 text-right">
                                <span
                                    className={twMerge(
                                        "block text-sm tabular-nums transition-colors",
                                        item.checked ? "text-muted-foreground" : "font-medium",
                                    )}
                                >
                                    {formatCurrency(item.checked ? (item.paidAmount ?? item.amount) : item.amount)}{" "}
                                    {symbol}
                                </span>
                                {item.checked && item.paidAmount !== undefined && item.paidAmount !== item.amount && (
                                    <span className="text-muted-foreground block text-[0.68rem] tabular-nums">
                                        {t("plannedAmount", {
                                            amount: formatCurrency(item.amount),
                                            currency: symbol,
                                        })}
                                    </span>
                                )}
                            </span>
                        </label>
                    </li>
                ))}
            </ul>
            <EssentialPaymentDialog
                essential={selectedEssential}
                type={type}
                open={Boolean(selectedEssential)}
                onOpenChange={(open) => {
                    if (!open) setSelectedEssential(null);
                }}
            />
        </div>
    );
};
