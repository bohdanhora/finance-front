"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";

import { twMerge } from "lib/tw";
import { formatCurrency } from "lib/utils";
import { byCategory } from "lib/statistics";
import { getCategoryLabel } from "constants/categories";
import { CategoryIcon } from "components/categories/category-icon";
import { Button } from "components/ui/button";
import { Checkbox } from "components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { TransactionType } from "types/transactions";

type Props = {
    periodTransactions: TransactionType[];
    hidden: ReadonlySet<string>;
    onToggle: (category: string) => void;
    onChange: (hidden: string[]) => void;
    currencySymbol: string;
};

export const CategoryFilter = ({ periodTransactions, hidden, onToggle, onChange, currencySymbol }: Props) => {
    const t = useTranslations("statistics");
    const tCat = useTranslations("categories");

    const rows = useMemo(() => {
        const slices = byCategory(periodTransactions);
        const present = new Set(slices.map((slice) => slice.name));
        const missing = [...hidden].filter((name) => !present.has(name)).map((name) => ({ name, value: 0 }));
        return [...slices, ...missing];
    }, [periodTransactions, hidden]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={hidden.size ? "outline" : "secondary"}
                    className={twMerge(hidden.size && "border-accent text-accent")}
                >
                    <SlidersHorizontal />
                    {hidden.size ? t("hiddenCount", { count: hidden.size }) : t("categoryFilter")}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="border-rule border-b p-4">
                    <p className="label">{t("categoryFilter")}</p>
                    <p className="text-ink-faint mt-1 text-xs">{t("categoryFilterHint")}</p>
                </div>
                {rows.length === 0 ? (
                    <p className="text-ink-faint p-4 text-sm">{t("noExpenses")}</p>
                ) : (
                    <ul className="max-h-80 overflow-y-auto">
                        {rows.map((row) => {
                            const checked = !hidden.has(row.name);
                            return (
                                <li key={row.name} className="border-rule border-b last:border-b-0">
                                    <label className="hover:bg-wash flex cursor-pointer items-center gap-3 px-4 py-2.5">
                                        <Checkbox checked={checked} onCheckedChange={() => onToggle(row.name)} />
                                        <CategoryIcon category={row.name} className="text-ink-faint size-4 shrink-0" />
                                        <span
                                            className={twMerge(
                                                "min-w-0 flex-1 truncate text-sm",
                                                !checked && "text-ink-faint line-through",
                                            )}
                                        >
                                            {getCategoryLabel(row.name, tCat)}
                                        </span>
                                        <span className="text-ink-faint shrink-0 font-mono text-2xs tabular-nums">
                                            {formatCurrency(row.value)} {currencySymbol}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <div className="border-rule flex border-t">
                    <Button variant="ghost" className="flex-1" disabled={!hidden.size} onClick={() => onChange([])}>
                        {t("showAll")}
                    </Button>
                    <Button
                        variant="ghost"
                        className="border-rule flex-1 border-l"
                        disabled={!rows.length}
                        onClick={() => onChange(rows.filter((row) => !hidden.has(row.name)).map((row) => row.name))}
                    >
                        {t("invertSelection")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
