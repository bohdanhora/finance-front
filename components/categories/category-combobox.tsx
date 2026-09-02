"use client";

import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import { CATEGORY_KEYS, EXPENSE_CATEGORY_KEYS, getCategoryLabel } from "constants/categories";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { CategoryIcon } from "./category-icon";

type Props = {
    value: string;
    onChange: (value: string) => void;
    includeIncome?: boolean;
    allowCustom?: boolean;
    className?: string;
};

export const CategoryCombobox = ({ value, onChange, includeIncome = false, allowCustom = true, className }: Props) => {
    const tCategories = useTranslations("categories");
    const tDialogs = useTranslations("dialogs");
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const keys = includeIncome ? CATEGORY_KEYS : EXPENSE_CATEGORY_KEYS;

    const options = useMemo(() => keys.map((key) => ({ key, label: tCategories(key) })), [keys, tCategories]);
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    const filtered = options.filter(
        ({ key, label }) =>
            key.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
            label.toLocaleLowerCase().includes(normalizedQuery.toLocaleLowerCase()),
    );
    const exactMatch = options.some(
        ({ key, label }) =>
            key.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase() ||
            label.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
    );
    const selectedLabel = value ? getCategoryLabel(value, tCategories) : tDialogs("chooseCategory");

    const select = (nextValue: string) => {
        onChange(nextValue);
        setQuery("");
        setOpen(false);
    };

    return (
        <Popover
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) setQuery("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="popover"
                    role="combobox"
                    aria-expanded={open}
                    className={twMerge(
                        "w-full justify-between px-3 font-normal",
                        !value && "text-muted-foreground",
                        className,
                    )}
                >
                    <span className="flex min-w-0 items-center gap-2">
                        {value && <CategoryIcon category={value} className="size-4 shrink-0" />}
                        <span className="truncate">{selectedLabel}</span>
                    </span>
                    <ChevronsUpDown className="text-muted-foreground size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
                <div className="relative mb-2">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        autoFocus
                        maxLength={40}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key !== "Enter" || !normalizedQuery) return;
                            event.preventDefault();
                            const exactOption = options.find(
                                ({ key, label }) =>
                                    key.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase() ||
                                    label.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
                            );
                            select(exactOption?.key ?? normalizedQuery);
                        }}
                        placeholder={tDialogs("categorySearch")}
                        className="pl-9"
                    />
                </div>

                <div className="max-h-64 space-y-1 overflow-y-auto">
                    {filtered.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => select(key)}
                            className="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm"
                        >
                            <CategoryIcon category={key} className="text-muted-foreground size-4" />
                            <span className="min-w-0 flex-1 truncate">{label}</span>
                            {value === key && <Check className="size-4 text-indigo-500" />}
                        </button>
                    ))}

                    {allowCustom && normalizedQuery && !exactMatch && (
                        <button
                            type="button"
                            onClick={() => select(normalizedQuery)}
                            className="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed px-2.5 py-2 text-left text-sm"
                        >
                            <Plus className="size-4 text-indigo-500" />
                            <span className="truncate">{tDialogs("createCategory", { name: normalizedQuery })}</span>
                        </button>
                    )}

                    {filtered.length === 0 && (!allowCustom || !normalizedQuery) && (
                        <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                            {tDialogs("noCategories")}
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
