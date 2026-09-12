"use client";

import { useTranslations } from "next-intl";

import { CategoryIcon } from "components/categories/category-icon";
import { getCategoryLabel } from "constants/categories";
import { MonobankCategoryTotal } from "lib/monobank";
import { formatCurrency } from "lib/utils";

export const CategoryBreakdown = ({
    totals,
    spent,
    symbol,
}: {
    totals: MonobankCategoryTotal[];
    spent: number;
    symbol: string;
}) => {
    const tCat = useTranslations("categories");
    const tMono = useTranslations("monobank");

    return (
        <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm sm:p-6">
            {totals.map((total) => {
                const share = spent > 0 ? Math.round((total.amount / spent) * 100) : 0;

                return (
                    <div key={total.category} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                                <CategoryIcon category={total.category} className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {getCategoryLabel(total.category, tCat)}
                            </span>
                            <span className="text-muted-foreground text-xs">
                                {tMono("operations", { count: total.count })}
                            </span>
                            <span className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums">
                                {formatCurrency(total.amount)} {symbol}
                            </span>
                        </div>
                        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                                style={{ width: `${Math.max(share, 2)}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
