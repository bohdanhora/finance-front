"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { getCurrencySymbol } from "lib/currency";
import { paydayStatus, summarizeExpectedIncomes } from "lib/month-plan";
import { formatCurrency } from "lib/utils";
import useStore from "store/general";
import { ExpectedIncome } from "types/transactions";
import { AnimatedMoney } from "./animated-number";
import { ExpectedIncomeDialog } from "./dialogs/expected-income";
import { ExpectedIncomeReceiveDialog } from "./dialogs/expected-income-receive";
import { ChecklistEmpty, ChecklistShell, SegmentBar } from "./essentials-checklist";
import { Checkbox } from "./ui/checkbox";

export const ExpectedIncomeList = () => {
    const t = useTranslations("expectedIncome");
    const tPossible = useTranslations("possible");
    const store = useStore();
    const [selectedIncome, setSelectedIncome] = useState<ExpectedIncome | null>(null);

    const items = store.expectedIncomes;
    const symbol = getCurrencySymbol(store.userCurrency);

    if (!items.length) {
        return (
            <ChecklistShell title={t("title")} actions={<ExpectedIncomeDialog triggerLabel={t("add")} />}>
                <ChecklistEmpty>{t("empty")}</ChecklistEmpty>
            </ChecklistShell>
        );
    }

    const summary = summarizeExpectedIncomes(items);

    const statusLine = (item: ExpectedIncome) => {
        if (item.received) {
            return item.receivedAt ? t("receivedOn", { date: dayjs(item.receivedAt).format("DD.MM") }) : t("received");
        }

        const status = paydayStatus(item.day);
        if (status === "today") return <span className="text-accent">{t("dueToday")}</span>;
        return (
            <span className={status === "late" ? "text-signal" : undefined}>
                {t(status === "late" ? "late" : "onDay", { day: item.day })}
            </span>
        );
    };

    return (
        <ChecklistShell
            title={t("progress", { received: summary.receivedCount, total: summary.total })}
            actions={<ExpectedIncomeDialog triggerLabel={tPossible("editList")} />}
            status={
                summary.pending > 0 ? (
                    <span>
                        <span className="text-ink-muted">{t("stillToCome")}: </span>
                        <span className="text-accent font-medium">
                            +<AnimatedMoney value={summary.pending} symbol={symbol} />
                        </span>
                    </span>
                ) : (
                    <span className="text-ink-muted">{t("allReceived")}</span>
                )
            }
        >
            <SegmentBar done={summary.receivedCount} total={summary.total} />

            <ul className="border-rule-strong mt-3 border-t">
                {items.map((item) => (
                    <li key={item.id} className="border-rule border-b">
                        <label className="hover:bg-surface flex min-h-12 cursor-pointer items-center gap-3 px-1 py-2.5 transition-colors">
                            <Checkbox checked={item.received} onCheckedChange={() => setSelectedIncome(item)} />
                            <span className="min-w-0 flex-1">
                                <span
                                    className={twMerge(
                                        "block truncate text-sm transition-colors",
                                        item.received && "text-ink-faint",
                                    )}
                                >
                                    {item.title}
                                </span>
                                <span className="text-ink-faint mt-0.5 block font-mono text-3xs uppercase">
                                    {statusLine(item)}
                                    {!item.recurring && ` · ${t("oneOff")}`}
                                </span>
                            </span>
                            <span className="shrink-0 text-right">
                                <span
                                    className={twMerge(
                                        "block font-mono text-xs tabular-nums transition-colors",
                                        item.received ? "text-ink-faint" : "text-accent",
                                    )}
                                >
                                    {item.received ? "" : "+"}
                                    {formatCurrency(
                                        item.received ? (item.receivedAmount ?? item.amount) : item.amount,
                                    )}{" "}
                                    {symbol}
                                </span>
                                {item.received &&
                                    item.receivedAmount !== undefined &&
                                    item.receivedAmount !== item.amount && (
                                        <span className="text-ink-faint block font-mono text-3xs tabular-nums">
                                            {tPossible("plannedAmount", {
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
            <ExpectedIncomeReceiveDialog
                income={selectedIncome}
                open={Boolean(selectedIncome)}
                onOpenChange={(open) => {
                    if (!open) setSelectedIncome(null);
                }}
            />
        </ChecklistShell>
    );
};
