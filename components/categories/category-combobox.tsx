"use client";

import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import { CATEGORY_KEYS, CategoryKey, EXPENSE_CATEGORY_KEYS, getCategoryLabel } from "constants/categories";
import { Button } from "components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { useIsMobile } from "hooks/use-is-mobile";
import { CategoryIcon } from "./category-icon";

type Props = {
    value: string;
    onChange: (value: string) => void;
    includeIncome?: boolean;
    allowCustom?: boolean;
    excludedKeys?: CategoryKey[];
    className?: string;
};

export const CategoryCombobox = ({
    value,
    onChange,
    includeIncome = false,
    allowCustom = true,
    excludedKeys = [],
    className,
}: Props) => {
    const tCategories = useTranslations("categories");
    const tDialogs = useTranslations("dialogs");
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const keys = (includeIncome ? CATEGORY_KEYS : EXPENSE_CATEGORY_KEYS).filter((key) => !excludedKeys.includes(key));

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

    const changeOpen = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
    };

    const submitQuery = () => {
        if (!normalizedQuery) return;

        const exactOption = options.find(
            ({ key, label }) =>
                key.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase() ||
                label.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase(),
        );

        if (!allowCustom && !exactOption) return;

        select(exactOption?.key ?? normalizedQuery);
    };

    const trigger = (
        <Button
            type="button"
            variant="popover"
            role="combobox"
            aria-expanded={open}
            className={twMerge(
                "h-11 w-full justify-between px-3 font-normal",
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
    );

    const search = (
        <div className="relative shrink-0">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
                autoFocus={isMobile === false}
                enterKeyHint="done"
                maxLength={40}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key !== "Enter" || !normalizedQuery) return;
                    event.preventDefault();
                    submitQuery();
                }}
                placeholder={tDialogs("categorySearch")}
                className="pl-9"
            />
        </div>
    );

    const list = (
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
            {filtered.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => select(key)}
                    className="hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm"
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
                    className="hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-dashed px-2.5 py-2.5 text-left text-sm"
                >
                    <Plus className="size-4 text-indigo-500" />
                    <span className="truncate">{tDialogs("createCategory", { name: normalizedQuery })}</span>
                </button>
            )}

            {filtered.length === 0 && (!allowCustom || !normalizedQuery) && (
                <p className="text-muted-foreground px-3 py-6 text-center text-sm">{tDialogs("noCategories")}</p>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <Dialog open={open} onOpenChange={changeOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    className="top-auto bottom-[var(--keyboard-inset,0px)] left-0 flex max-h-[calc(82dvh-var(--keyboard-inset,0px))] w-full max-w-full translate-x-0 translate-y-0 flex-col gap-3 rounded-t-[22px] rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                >
                    <span aria-hidden="true" className="bg-border mx-auto h-1 w-10 shrink-0 rounded-full" />
                    <DialogTitle className="shrink-0 text-base">{tDialogs("category")}</DialogTitle>
                    {search}
                    {list}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Popover open={open} onOpenChange={changeOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent
                align="start"
                collisionPadding={12}
                className="flex max-h-[min(24rem,calc(var(--radix-popover-content-available-height)-var(--keyboard-inset,0px)))] w-[var(--radix-popover-trigger-width)] flex-col gap-2 p-2"
            >
                {search}
                {list}
            </PopoverContent>
        </Popover>
    );
};
