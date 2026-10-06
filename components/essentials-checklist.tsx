"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { EssentialsType } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { formatMonthKey } from "lib/date-locale";
import { formatCurrency } from "lib/utils";
import useStore from "store/general";
import { EssentialType } from "types/transactions";
import { AnimatedMoney } from "./animated-number";
import { EssentialPaymentDialog } from "./dialogs/essential-payment";
import { Checkbox } from "./ui/checkbox";

export const SegmentBar = ({ done, total }: { done: number; total: number }) => (
    <div className="flex h-1.5 w-full gap-0.5" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
            <span
                key={index}
                className={twMerge(
                    "h-full flex-1 transition-colors duration-500",
                    index < done ? "bg-accent" : "bg-wash",
                )}
            />
        ))}
    </div>
);

export const ChecklistShell = ({
    title,
    status,
    actions,
    children,
}: {
    title: React.ReactNode;
    status?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="min-w-0">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h3 className="label text-ink">{title}</h3>
            {actions && <div className="-my-1 flex flex-wrap items-center gap-1.5">{actions}</div>}
        </div>
        {status && <div className="mt-1 text-sm tabular-nums">{status}</div>}
        <div className="mt-3">{children}</div>
    </div>
);

export const ChecklistEmpty = ({ children }: { children: React.ReactNode }) => (
    <p className="border-rule text-ink-faint border border-dashed px-4 py-6 text-center text-sm">{children}</p>
);

export const EssentialsChecklist = ({
    nextMonth = false,
    actions,
}: {
    nextMonth?: boolean;
    actions?: React.ReactNode;
}) => {
    const t = useTranslations("possible");
    const locale = useLocale();
    const store = useStore();
    const [selectedEssential, setSelectedEssential] = useState<EssentialType | null>(null);

    const items = nextMonth ? store.nextMonthEssentialsArray : store.essentialsArray;
    const symbol = getCurrencySymbol(store.userCurrency);

    const paidCount = items.filter((item) => item.checked).length;
    const outstanding = items.reduce((sum, item) => (item.checked ? sum : sum + item.amount), 0);

    const type = nextMonth ? EssentialsType.NEXT_MONTH : EssentialsType.THIS_MONTH;

    if (!items.length) {
        return (
            <ChecklistShell title={t("essentialsTitle")} actions={actions}>
                <ChecklistEmpty>{t("noEssentials")}</ChecklistEmpty>
            </ChecklistShell>
        );
    }

    return (
        <ChecklistShell
            title={t("essentialsProgress", { paid: paidCount, total: items.length })}
            actions={actions}
            status={
                outstanding > 0 ? (
                    <span>
                        <span className="text-ink-muted">{t("stillToPay")}: </span>
                        <span className="font-medium">
                            <AnimatedMoney value={outstanding} symbol={symbol} />
                        </span>
                    </span>
                ) : (
                    <span className="text-accent">{t("allPaid")}</span>
                )
            }
        >
            <SegmentBar done={paidCount} total={items.length} />

            <ul className="border-rule-strong mt-3 border-t">
                {items.map((item) => (
                    <li key={item.id} className="border-rule border-b">
                        <label className="hover:bg-surface flex min-h-12 cursor-pointer items-center gap-3 px-1 py-2.5 transition-colors">
                            <Checkbox checked={item.checked} onCheckedChange={() => setSelectedEssential(item)} />
                            <span className="min-w-0 flex-1">
                                <span
                                    className={twMerge(
                                        "block truncate text-sm transition-colors",
                                        item.checked && "text-ink-faint line-through",
                                    )}
                                >
                                    {item.title}
                                </span>
                                {item.carriedFrom && !item.checked && (
                                    <span className="text-signal mt-0.5 block font-mono text-3xs uppercase">
                                        {t("carriedFrom", { month: formatMonthKey(item.carriedFrom, locale) })}
                                    </span>
                                )}
                            </span>
                            <span className="shrink-0 text-right">
                                <span
                                    className={twMerge(
                                        "block font-mono text-xs tabular-nums transition-colors",
                                        item.checked ? "text-ink-faint" : "text-ink",
                                    )}
                                >
                                    {formatCurrency(item.checked ? (item.paidAmount ?? item.amount) : item.amount)}{" "}
                                    {symbol}
                                </span>
                                {item.checked && item.paidAmount !== undefined && item.paidAmount !== item.amount && (
                                    <span className="text-ink-faint block font-mono text-3xs tabular-nums">
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
        </ChecklistShell>
    );
};
