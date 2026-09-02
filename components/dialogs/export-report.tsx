"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { Download, Loader2 } from "lucide-react";

import { CURRENCY } from "constants/index";
import { CategoryKey, getCategoryLabel } from "constants/categories";
import { formatMonthKey, getIntlLocale } from "lib/date-locale";
import { buildReportModel } from "lib/report/data";
import { downloadReportPdf } from "lib/report/export";
import { ReportLabels } from "lib/report/labels";
import {
    REPORT_PERIODS,
    REPORT_SECTIONS,
    ReportPeriod,
    ReportSection,
    TRANSACTION_FILTERS,
    TransactionsFilter,
} from "lib/report/types";
import useBankStore from "store/bank";
import useStore from "store/general";

import { Button } from "components/ui/button";
import { Checkbox } from "components/ui/checkbox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "components/ui/dialog";
import { Label } from "components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const DEFAULT_SECTIONS: ReportSection[] = ["summary", "categories", "dynamics", "essentials", "transactions"];

export const ExportReportDialog = ({ open, onOpenChange }: Props) => {
    const t = useTranslations("report");
    const tCategory = useTranslations("categories");
    const locale = useLocale();
    const intlLocale = getIntlLocale(locale);

    const store = useStore();
    const bank = useBankStore();

    const [period, setPeriod] = useState<ReportPeriod>("currentMonth");
    const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS);
    const [transactionsFilter, setTransactionsFilter] = useState<TransactionsFilter>("all");
    const [pending, setPending] = useState(false);

    const rates = useMemo(
        () => ({ usdToUah: bank.usd?.rateBuy ?? 0, eurToUah: bank.eur?.rateBuy ?? 0 }),
        [bank.eur?.rateBuy, bank.usd?.rateBuy],
    );

    const options = useMemo(() => ({ period, sections, transactionsFilter }), [period, sections, transactionsFilter]);

    const model = useMemo(
        () =>
            buildReportModel({
                options,
                currency: store.userCurrency,
                rates,
                totalAmount: store.totalAmount,
                transactions: store.transactions,
                essentials: store.essentialsArray,
                savingsGoals: store.savingsGoals,
                savingsOperations: store.savingsOperations,
            }),
        [
            options,
            rates,
            store.essentialsArray,
            store.savingsGoals,
            store.savingsOperations,
            store.totalAmount,
            store.transactions,
            store.userCurrency,
        ],
    );

    /** What each section will actually contribute, so nobody exports an empty page. */
    const sectionCounts: Record<ReportSection, number> = {
        summary: model.summary.transactionCount,
        categories: model.categories.length,
        dynamics: model.dynamics.filter((row) => row.income > 0 || row.expense > 0).length,
        essentials: model.essentials.items.length,
        savings: model.savings.goals.length + model.savings.slices.length,
        transactions: model.transactions.length,
    };

    const toggleSection = (section: ReportSection, checked: boolean) =>
        setSections((current) =>
            checked ? [...current, section] : current.filter((existing) => existing !== section),
        );

    const periodLabel = useMemo(() => {
        if (period === "all") return t("periods.all");
        if (!model.range.from) return t("periods.all");

        const format = (value: string) =>
            new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
                new Date(value),
            );

        if (period === "currentMonth" || period === "previousMonth") {
            return formatMonthKey(model.range.from.slice(0, 7), locale);
        }

        return `${format(model.range.from)} - ${format(model.range.to)}`;
    }, [intlLocale, locale, model.range.from, model.range.to, period, t]);

    const buildLabels = useCallback(
        (): ReportLabels => ({
            title: t("title"),
            periodLabel,
            generatedAt: t("generatedAt"),
            amountsIn: t("amountsIn"),
            page: t("page"),
            of: t("of"),
            nothingHere: t("nothingHere"),
            summary: {
                heading: t("sections.summary"),
                balance: t("summary.balance"),
                income: t("summary.income"),
                expense: t("summary.expense"),
                net: t("summary.net"),
                savings: t("summary.savings"),
                essentialsRemaining: t("summary.essentialsRemaining"),
                transactionCount: t("summary.transactionCount"),
                averageExpense: t("summary.averageExpense"),
                largestExpense: t("summary.largestExpense"),
                rateMissing: t("summary.rateMissing"),
            },
            categories: {
                heading: t("sections.categories"),
                category: t("categories.category"),
                amount: t("categories.amount"),
                share: t("categories.share"),
                other: t("categories.other"),
            },
            dynamics: {
                heading: t("sections.dynamics"),
                income: t("dynamics.income"),
                expense: t("dynamics.expense"),
                net: t("dynamics.net"),
            },
            essentials: {
                heading: t("sections.essentials"),
                subheading: t("essentials.subheading"),
                payment: t("essentials.payment"),
                plan: t("essentials.plan"),
                paid: t("essentials.paid"),
                planned: t("essentials.planned"),
                remaining: t("essentials.remaining"),
                no: t("essentials.no"),
            },
            savings: {
                heading: t("sections.savings"),
                total: t("savings.total"),
                cash: t("savings.cash"),
                card: t("savings.card"),
                breakdown: t("savings.breakdown"),
                goals: t("savings.goals"),
                saved: t("savings.saved"),
                monthly: t("savings.monthly"),
                deadline: t("savings.deadline"),
                daysLeft: t("savings.daysLeft"),
            },
            transactions: {
                heading: t("sections.transactions"),
                date: t("transactions.date"),
                category: t("transactions.category"),
                description: t("transactions.description"),
                amount: t("transactions.amount"),
            },
        }),
        [periodLabel, t],
    );

    const handleExport = async () => {
        if (!sections.length) {
            toast.error(t("pickAtLeastOne"));
            return;
        }

        setPending(true);

        try {
            const numberFormat = new Intl.NumberFormat(intlLocale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            const dateFormat = new Intl.DateTimeFormat(intlLocale, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });

            await downloadReportPdf({
                model,
                sections,
                labels: buildLabels(),
                fileName: `finance-report-${model.range.to}.pdf`,
                formatters: {
                    amount: (value) => numberFormat.format(value),
                    money: (value, currency?: CURRENCY) =>
                        `${numberFormat.format(value)} ${(currency ?? model.currency).toUpperCase()}`,
                    date: (value) => dateFormat.format(new Date(value)),
                    month: (monthKey) => formatMonthKey(monthKey, locale, "short"),
                    percent: (value) => `${value.toFixed(1)}%`,
                    categoryLabel: (key) => getCategoryLabel(key, tCategory as (key: CategoryKey) => string),
                },
            });

            onOpenChange(false);
        } catch {
            toast.error(t("failed"));
        } finally {
            setPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t("dialogTitle")}</DialogTitle>
                    <DialogDescription>{t("dialogDescription")}</DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label>{t("periodTitle")}</Label>
                        <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {REPORT_PERIODS.map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {t(`periods.${item}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-xs">{periodLabel}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>{t("sectionsTitle")}</Label>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                            {REPORT_SECTIONS.map((section) => {
                                const checked = sections.includes(section);
                                const count = sectionCounts[section];

                                return (
                                    <label
                                        key={section}
                                        htmlFor={`report-${section}`}
                                        className="border-border/70 hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
                                    >
                                        <Checkbox
                                            id={`report-${section}`}
                                            checked={checked}
                                            onCheckedChange={(value) => toggleSection(section, value === true)}
                                        />
                                        <span className="flex flex-col">
                                            <span className="text-sm leading-tight">{t(`sections.${section}`)}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {count ? t("itemsCount", { count }) : t("empty")}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {sections.includes("transactions") && (
                        <div className="space-y-2">
                            <Label>{t("transactionsFilterTitle")}</Label>
                            <Select
                                value={transactionsFilter}
                                onValueChange={(value) => setTransactionsFilter(value as TransactionsFilter)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TRANSACTION_FILTERS.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {t(`filters.${item}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">{t("cancel")}</Button>
                    </DialogClose>
                    <Button onClick={handleExport} disabled={pending || !sections.length}>
                        {pending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        {pending ? t("exporting") : t("download")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
