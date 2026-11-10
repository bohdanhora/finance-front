"use client";

import { Fragment, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Focus, Gauge, Search, X } from "lucide-react";

import { twMerge } from "lib/tw";
import { formatCurrency, createDateString } from "lib/utils";
import {
    byCategory,
    categoryDeltas,
    categoryDetails,
    categoryHistory,
    descriptionKey,
    groupByDescription,
    hiddenSummary,
    searchTransactions,
    type CategoryDelta,
    type MonthKey,
} from "lib/statistics";
import { formatMonthKey } from "lib/date-locale";
import { getCategoryLabel } from "constants/categories";
import { TransactionEnum } from "constants/index";
import { CategoryIcon } from "components/categories/category-icon";
import { RowMenu } from "components/row-menu";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { ViewSwitcher } from "components/charts/view-switcher";
import { CategoryLimitDialog } from "components/charts/category-limit-dialog";
import { TransactionType } from "types/transactions";

const GROUP_LIMIT = 8;
const PURCHASE_PAGE = 20;

type Mode = "categories" | "merchants" | "purchases";
type PurchaseOrder = "value" | "date";

type Props = {
    transactions: TransactionType[];
    periodTransactions: TransactionType[];
    previousTransactions: TransactionType[];
    historyTransactions: TransactionType[];
    historyMonth: MonthKey;
    hidden: ReadonlySet<string>;
    limits: Record<string, number>;
    showLimits: boolean;
    onToggle: (category: string) => void;
    onShowOnly: (category: string) => void;
    onShowAll: () => void;
    onSetLimit: (category: string, limit: number | null) => void;
    currencySymbol: string;
};

const useMoney = (symbol: string) => (value: number) => `${formatCurrency(value)} ${symbol}`;

const Delta = ({ delta, money }: { delta?: CategoryDelta; money: (value: number) => string }) => {
    const t = useTranslations("statistics");
    if (!delta) return null;
    if (delta.previous === 0) return <span className="text-ink-faint">{t("newInPeriod")}</span>;
    if (Math.abs(delta.change) < 0.01) return <span className="text-ink-faint">{t("sameAsBefore")}</span>;

    const up = delta.change > 0;
    const Icon = up ? ArrowUp : ArrowDown;
    return (
        <span
            className={twMerge("inline-flex items-center gap-0.5", up ? "text-signal" : "text-accent")}
            title={t("deltaHint", { amount: money(delta.previous) })}
        >
            <Icon className="size-3" />
            {money(Math.abs(delta.change))}
        </span>
    );
};

const CategoryTrend = ({
    transactions,
    category,
    month,
    money,
}: {
    transactions: TransactionType[];
    category: string;
    month: MonthKey;
    money: (value: number) => string;
}) => {
    const t = useTranslations("statistics");
    const locale = useLocale();
    const { points, average } = useMemo(
        () => categoryHistory(transactions, category, month),
        [transactions, category, month],
    );
    const max = Math.max(...points.map((point) => point.value), 1);
    const current = points[points.length - 1]?.value ?? 0;
    const difference = average > 0 ? Math.round(((current - average) / average) * 100) : null;

    return (
        <div className="border-rule flex flex-wrap items-end gap-x-6 gap-y-3 border-b py-3 pr-3">
            <div className="flex h-16 items-end gap-1.5" aria-hidden="true">
                {points.map((point, index) => (
                    <div key={point.month} className="flex w-8 flex-col items-center gap-1">
                        <span
                            className={twMerge(
                                "w-full",
                                index === points.length - 1 ? "bg-accent" : "bg-ink-faint opacity-40",
                            )}
                            style={{ height: `${Math.max((point.value / max) * 44, point.value > 0 ? 2 : 0)}px` }}
                        />
                        <span className="text-ink-faint font-mono text-3xs uppercase">
                            {formatMonthKey(point.month, locale, "short")}
                        </span>
                    </div>
                ))}
            </div>
            <div className="min-w-0 flex-1 text-xs">
                <p className="label">{t("lastSixMonths")}</p>
                <p className="mt-1">
                    {average > 0 ? t("usualMonth", { amount: money(average) }) : t("noHistory")}
                    {difference !== null && difference !== 0 && (
                        <span className={twMerge("ml-2", difference > 0 ? "text-signal" : "text-accent")}>
                            {difference > 0
                                ? t("aboveUsual", { percent: difference })
                                : t("belowUsual", { percent: Math.abs(difference) })}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
};

const GroupList = ({
    transactions,
    category,
    money,
}: {
    transactions: TransactionType[];
    category: string;
    money: (value: number) => string;
}) => {
    const t = useTranslations("statistics");
    const [expanded, setExpanded] = useState(false);
    const groups = useMemo(() => categoryDetails(transactions, category), [transactions, category]);
    const shown = expanded ? groups : groups.slice(0, GROUP_LIMIT);

    return (
        <>
            <ul>
                {shown.map((group) => (
                    <li
                        key={group.key}
                        className="border-rule flex items-center gap-3 border-b py-2 pr-3 last:border-b-0"
                    >
                        <div className="min-w-0 flex-1">
                            <p className={twMerge("truncate text-sm", !group.label && "text-ink-faint")}>
                                {group.label || t("noDescription")}
                            </p>
                            <p className="text-ink-faint mt-0.5 font-mono text-3xs uppercase">
                                {t("purchases", { count: group.count })} ·{" "}
                                {group.count > 1
                                    ? t("lastPurchase", { date: createDateString(new Date(group.lastDate)) })
                                    : createDateString(new Date(group.lastDate))}
                            </p>
                        </div>
                        <span className="text-ink-faint shrink-0 font-mono text-2xs tabular-nums">
                            {group.percent}%
                        </span>
                        <span className="w-28 shrink-0 text-right font-mono text-xs tabular-nums">
                            {money(group.value)}
                        </span>
                    </li>
                ))}
            </ul>
            {groups.length > GROUP_LIMIT && (
                <Button variant="link" size="sm" className="my-2" onClick={() => setExpanded((value) => !value)}>
                    {expanded ? t("showLess") : t("showAllGroups", { count: groups.length })}
                </Button>
            )}
        </>
    );
};

const PurchaseRow = ({
    tx,
    money,
    categoryLabel,
}: {
    tx: TransactionType;
    money: (value: number) => string;
    categoryLabel: (category: string) => string;
}) => (
    <li className="border-rule flex items-center gap-3 border-b py-2.5 last:border-b-0">
        <span className="border-rule flex size-8 shrink-0 items-center justify-center border">
            <CategoryIcon category={tx.categorie} className="text-ink-faint size-4" />
        </span>
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{tx.description || categoryLabel(tx.categorie)}</p>
            <p className="text-ink-faint mt-0.5 font-mono text-3xs uppercase">
                {categoryLabel(tx.categorie)} · {createDateString(new Date(tx.date))}
            </p>
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums">-{money(tx.value)}</span>
    </li>
);

export const CategoryBreakdown = ({
    transactions,
    periodTransactions,
    previousTransactions,
    historyTransactions,
    historyMonth,
    hidden,
    limits,
    showLimits,
    onToggle,
    onShowOnly,
    onShowAll,
    onSetLimit,
    currencySymbol,
}: Props) => {
    const t = useTranslations("statistics");
    const tCat = useTranslations("categories");
    const categoryLabel = (category: string) => getCategoryLabel(category, tCat);
    const money = useMoney(currencySymbol);

    const [mode, setMode] = useState<Mode>("categories");
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState<string | null>(null);
    const [limitFor, setLimitFor] = useState<string | null>(null);
    const [order, setOrder] = useState<PurchaseOrder>("value");
    const [purchaseCount, setPurchaseCount] = useState(PURCHASE_PAGE);

    const searched = useMemo(
        () => searchTransactions(transactions, query, (name) => getCategoryLabel(name, tCat)),
        [transactions, query, tCat],
    );
    const searchedPrevious = useMemo(
        () => searchTransactions(previousTransactions, query, (name) => getCategoryLabel(name, tCat)),
        [previousTransactions, query, tCat],
    );
    const expenses = useMemo(() => searched.filter((tx) => tx.transactionType === TransactionEnum.EXPENSE), [searched]);
    const categories = useMemo(() => byCategory(searched), [searched]);
    const deltas = useMemo(
        () => categoryDeltas(categories, byCategory(searchedPrevious)),
        [categories, searchedPrevious],
    );
    const merchants = useMemo(() => groupByDescription(searched), [searched]);
    const purchases = useMemo(
        () =>
            [...expenses].sort((a, b) =>
                order === "value" ? b.value - a.value : new Date(b.date).getTime() - new Date(a.date).getTime(),
            ),
        [expenses, order],
    );
    const excluded = useMemo(() => hiddenSummary(periodTransactions, hidden), [periodTransactions, hidden]);

    const total = categories.reduce((sum, category) => sum + category.value, 0);
    const max = categories[0]?.value || 1;
    const toggleOpen = (key: string) => setOpen((current) => (current === key ? null : key));
    const changeMode = (next: Mode) => {
        setMode(next);
        setOpen(null);
        setPurchaseCount(PURCHASE_PAGE);
    };

    const empty = (
        <p className="text-ink-faint py-16 text-center text-sm">
            {query.trim() ? t("nothingFound") : excluded.categories.length ? t("everythingHidden") : t("noExpenses")}
        </p>
    );

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <ViewSwitcher
                    value={mode}
                    onChange={changeMode}
                    options={[
                        { value: "categories", label: t("modeCategories") },
                        { value: "merchants", label: t("modeMerchants") },
                        { value: "purchases", label: t("modePurchases") },
                    ]}
                />
                <div className="relative min-w-48 flex-1">
                    <Search className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t("searchPlaceholder")}
                        aria-label={t("searchPlaceholder")}
                        className="h-9 pr-9 pl-9"
                    />
                    {query && (
                        <button
                            type="button"
                            aria-label={t("clearSearch")}
                            onClick={() => setQuery("")}
                            className="text-ink-faint hover:text-ink absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="border-rule-strong flex flex-wrap items-baseline justify-between gap-3 border-b pb-3">
                <span className="label">
                    {query.trim()
                        ? t("foundTotal", { count: expenses.length })
                        : excluded.categories.length
                          ? t("expenseCounted")
                          : t("expense")}
                </span>
                <span className="figure text-figure">
                    {formatCurrency(total)} <span className="text-ink-faint">{currencySymbol}</span>
                </span>
            </div>

            {categories.length === 0 ? (
                empty
            ) : mode === "categories" ? (
                <ul>
                    {categories.map((cat) => {
                        const isOpen = open === cat.name;
                        const limit = showLimits ? limits[cat.name] : undefined;
                        const over = limit !== undefined && cat.value > limit;
                        return (
                            <Fragment key={cat.name}>
                                <RowMenu
                                    title={categoryLabel(cat.name)}
                                    copyValue={formatCurrency(cat.value)}
                                    actions={[
                                        {
                                            key: "hide",
                                            label: t("hideCategory"),
                                            icon: <EyeOff />,
                                            onSelect: () => onToggle(cat.name),
                                        },
                                        {
                                            key: "only",
                                            label: t("showOnly"),
                                            icon: <Focus />,
                                            onSelect: () => onShowOnly(cat.name),
                                            disabled: categories.length < 2,
                                        },
                                        ...(showLimits
                                            ? [
                                                  {
                                                      key: "limit",
                                                      label: limit ? t("editLimit") : t("setLimit"),
                                                      icon: <Gauge />,
                                                      onSelect: () => setLimitFor(cat.name),
                                                  },
                                              ]
                                            : []),
                                        ...(hidden.size
                                            ? [{ key: "all", label: t("showAll"), icon: <Eye />, onSelect: onShowAll }]
                                            : []),
                                    ]}
                                >
                                    <li className="border-rule flex items-stretch border-b">
                                        <button
                                            type="button"
                                            aria-expanded={isOpen}
                                            onClick={() => toggleOpen(cat.name)}
                                            className="hover:bg-wash grid min-w-0 flex-1 cursor-pointer grid-cols-12 items-center gap-x-3 gap-y-2 py-3 pr-2 text-left transition-colors"
                                        >
                                            <span className="col-span-7 flex min-w-0 items-center gap-2.5 text-sm sm:col-span-4">
                                                <ChevronDown
                                                    className={twMerge(
                                                        "text-ink-faint size-3.5 shrink-0 transition-transform",
                                                        isOpen && "text-accent rotate-180",
                                                    )}
                                                />
                                                <CategoryIcon
                                                    category={cat.name}
                                                    className="text-ink-faint size-4 shrink-0"
                                                />
                                                <span className="break-words">{categoryLabel(cat.name)}</span>
                                            </span>
                                            <span className="col-span-5 flex flex-col items-end gap-0.5 font-mono text-xs tabular-nums sm:order-last sm:col-span-3">
                                                <span className="whitespace-nowrap">{money(cat.value)}</span>
                                                <span className="flex items-center gap-2 text-3xs whitespace-nowrap">
                                                    <Delta delta={deltas.get(cat.name)} money={money} />
                                                    <span className="text-ink-faint">{cat.percent}%</span>
                                                </span>
                                            </span>
                                            <span className="col-span-12 flex flex-col gap-1 sm:col-span-5">
                                                <span className="bg-wash h-2">
                                                    <span
                                                        className={twMerge(
                                                            "block h-full transition-[width] duration-500",
                                                            over ? "bg-signal" : "bg-accent",
                                                        )}
                                                        style={{
                                                            width: `${Math.min((cat.value / (limit ?? max)) * 100, 100)}%`,
                                                        }}
                                                    />
                                                </span>
                                                {limit !== undefined && (
                                                    <span
                                                        className={twMerge(
                                                            "font-mono text-3xs uppercase",
                                                            over ? "text-signal" : "text-ink-faint",
                                                        )}
                                                    >
                                                        {t("limitOf", { amount: money(limit) })} ·{" "}
                                                        {over
                                                            ? t("limitOver", { amount: money(cat.value - limit) })
                                                            : t("limitLeft", { amount: money(limit - cat.value) })}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-auto self-stretch"
                                            aria-label={t("hideCategory")}
                                            title={t("hideCategory")}
                                            onClick={() => onToggle(cat.name)}
                                        >
                                            <EyeOff className="size-4" />
                                        </Button>
                                    </li>
                                </RowMenu>
                                {isOpen && (
                                    <li className="border-rule border-b py-2">
                                        <div className="bg-surface border-l-accent border-l-2 pl-4 sm:ml-6">
                                            <CategoryTrend
                                                transactions={historyTransactions}
                                                category={cat.name}
                                                month={historyMonth}
                                                money={money}
                                            />
                                            <GroupList transactions={searched} category={cat.name} money={money} />
                                            {showLimits && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="my-2"
                                                    onClick={() => setLimitFor(cat.name)}
                                                >
                                                    <Gauge />
                                                    {limit ? t("editLimit") : t("setLimit")}
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                )}
                            </Fragment>
                        );
                    })}
                </ul>
            ) : mode === "merchants" ? (
                <ul>
                    {merchants.map((group) => {
                        const isOpen = open === group.key;
                        const items = isOpen
                            ? expenses
                                  .filter((tx) => descriptionKey(tx.description ?? "") === group.key)
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            : [];
                        return (
                            <Fragment key={group.key}>
                                <li className="border-rule border-b">
                                    <button
                                        type="button"
                                        aria-expanded={isOpen}
                                        onClick={() => toggleOpen(group.key)}
                                        className="hover:bg-wash flex w-full cursor-pointer items-center gap-3 py-3 pr-3 text-left transition-colors"
                                    >
                                        <ChevronDown
                                            className={twMerge(
                                                "text-ink-faint size-3.5 shrink-0 transition-transform",
                                                isOpen && "text-accent rotate-180",
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={twMerge(
                                                    "truncate text-sm",
                                                    !group.label && "text-ink-faint",
                                                )}
                                            >
                                                {group.label || t("noDescription")}
                                            </p>
                                            <p className="text-ink-faint mt-0.5 truncate font-mono text-3xs uppercase">
                                                {t("purchases", { count: group.count })} ·{" "}
                                                {group.categories.map(categoryLabel).join(", ")}
                                            </p>
                                        </div>
                                        <span className="text-ink-faint shrink-0 font-mono text-2xs tabular-nums">
                                            {group.percent}%
                                        </span>
                                        <span className="w-28 shrink-0 text-right font-mono text-xs tabular-nums">
                                            {money(group.value)}
                                        </span>
                                    </button>
                                </li>
                                {isOpen && (
                                    <li className="border-rule border-b py-2">
                                        <ul className="bg-surface border-l-accent border-l-2 pr-3 pl-4 sm:ml-6">
                                            {items.map((tx) => (
                                                <PurchaseRow
                                                    key={tx.id}
                                                    tx={tx}
                                                    money={money}
                                                    categoryLabel={categoryLabel}
                                                />
                                            ))}
                                        </ul>
                                    </li>
                                )}
                            </Fragment>
                        );
                    })}
                </ul>
            ) : (
                <div>
                    <div className="border-rule flex items-center justify-between gap-3 border-b py-2">
                        <span className="label">{t("purchases", { count: purchases.length })}</span>
                        <ViewSwitcher
                            value={order}
                            onChange={setOrder}
                            options={[
                                { value: "value", label: t("byAmount") },
                                { value: "date", label: t("byDate") },
                            ]}
                        />
                    </div>
                    <ul>
                        {purchases.slice(0, purchaseCount).map((tx) => (
                            <PurchaseRow key={tx.id} tx={tx} money={money} categoryLabel={categoryLabel} />
                        ))}
                    </ul>
                    {purchases.length > purchaseCount && (
                        <Button
                            variant="link"
                            size="sm"
                            className="mt-3"
                            onClick={() => setPurchaseCount((count) => count + PURCHASE_PAGE)}
                        >
                            {t("showMore", { count: Math.min(PURCHASE_PAGE, purchases.length - purchaseCount) })}
                        </Button>
                    )}
                </div>
            )}

            {excluded.categories.length > 0 && (
                <div className="mt-6">
                    <div className="border-rule-strong flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                        <span className="label">
                            {t("excludedTitle")} · {money(excluded.total)}
                        </span>
                        <Button variant="link" size="sm" onClick={onShowAll}>
                            {t("showAll")}
                        </Button>
                    </div>
                    <ul>
                        {excluded.categories.map((cat) => (
                            <li
                                key={cat.name}
                                className="border-rule text-ink-faint flex items-center gap-3 border-b py-2"
                            >
                                <CategoryIcon category={cat.name} className="size-4 shrink-0" />
                                <span className="min-w-0 flex-1 truncate text-sm line-through">
                                    {categoryLabel(cat.name)}
                                </span>
                                <span className="shrink-0 font-mono text-xs tabular-nums">{money(cat.value)}</span>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={t("showCategory")}
                                    title={t("showCategory")}
                                    onClick={() => onToggle(cat.name)}
                                >
                                    <Eye className="size-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <p className="text-ink-faint mt-2 text-xs">{t("excludedHint")}</p>
                </div>
            )}

            <CategoryLimitDialog
                category={limitFor}
                label={limitFor ? categoryLabel(limitFor) : ""}
                current={limitFor ? limits[limitFor] : undefined}
                currencySymbol={currencySymbol}
                onClose={() => setLimitFor(null)}
                onSave={onSetLimit}
            />
        </div>
    );
};
