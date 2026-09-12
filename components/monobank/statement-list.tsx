"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { CategoryIcon } from "components/categories/category-icon";
import { getCategoryLabel } from "constants/categories";
import { categoryByMcc, currencySymbolByCode, fromMinorUnits } from "lib/monobank";
import { formatCurrency } from "lib/utils";
import { MonobankStatementItem } from "types/monobank";

export const StatementList = ({ items }: { items: MonobankStatementItem[] }) => {
    const t = useTranslations("monobank");
    const tCat = useTranslations("categories");

    return (
        <ul className="border-border bg-card divide-border divide-y rounded-2xl border shadow-sm">
            {items.map((item) => {
                const category = categoryByMcc(item.mcc);
                const income = item.amount >= 0;
                const symbol = currencySymbolByCode(item.currencyCode);
                const cashback = fromMinorUnits(item.cashbackAmount || 0);

                return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                        <span
                            className={twMerge(
                                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                income
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
                            )}
                        >
                            <CategoryIcon category={income ? "income" : category} className="size-4" />
                        </span>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.description}</p>
                            <p className="text-muted-foreground truncate text-xs">
                                {getCategoryLabel(income ? "income" : category, tCat)} ·{" "}
                                {dayjs.unix(item.time).format("DD/MM HH:mm")}
                                {item.hold ? ` · ${t("hold")}` : ""}
                            </p>
                            {item.comment && <p className="text-muted-foreground truncate text-xs">{item.comment}</p>}
                        </div>

                        <div className="shrink-0 text-right">
                            <p
                                className={twMerge(
                                    "text-sm font-semibold tabular-nums",
                                    income ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                                )}
                            >
                                {income ? "+" : "-"}
                                {formatCurrency(fromMinorUnits(Math.abs(item.amount)))} {symbol}
                            </p>
                            {cashback > 0 && (
                                <p className="text-xs text-amber-600 tabular-nums dark:text-amber-400">
                                    {t("cashbackEarned", { amount: `${formatCurrency(cashback)} ${symbol}` })}
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};
