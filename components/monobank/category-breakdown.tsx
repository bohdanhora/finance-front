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
        <div className="border-rule-strong border-t">
            {totals.map((total) => {
                const share = spent > 0 ? Math.round((total.amount / spent) * 100) : 0;

                return (
                    <div key={total.category} className="border-rule flex flex-col gap-2 border-b py-3">
                        <div className="flex items-center gap-3">
                            <CategoryIcon category={total.category} className="text-ink-faint size-4 shrink-0" />
                            <span className="min-w-0 flex-1 text-sm break-words">
                                {getCategoryLabel(total.category, tCat)}
                            </span>
                            <span className="label hidden sm:inline">
                                {tMono("operations", { count: total.count })}
                            </span>
                            <span className="shrink-0 text-right font-mono text-xs tabular-nums">
                                {formatCurrency(total.amount)} {symbol}
                            </span>
                        </div>
                        <div className="bg-wash h-1.5 w-full">
                            <div className="h-full bg-accent" style={{ width: `${Math.max(share, 2)}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
