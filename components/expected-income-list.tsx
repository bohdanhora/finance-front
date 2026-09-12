"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { getCurrencySymbol } from "lib/currency";
import { paydayStatus, summarizeExpectedIncomes } from "lib/month-plan";
import { formatCurrency } from "lib/utils";
import useStore from "store/general";
import { ExpectedIncome } from "types/transactions";
import { AnimatedMoney } from "./animated-number";
import { ExpectedIncomeDialog } from "./dialogs/expected-income";
import { ExpectedIncomeReceiveDialog } from "./dialogs/expected-income-receive";
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
            <div className="border-border flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground max-w-xl text-sm">{t("empty")}</p>
                <ExpectedIncomeDialog triggerLabel={t("add")} />
            </div>
        );
    }

    const summary = summarizeExpectedIncomes(items);
    const progress = Math.round((summary.receivedCount / summary.total) * 100);

    const statusLine = (item: ExpectedIncome) => {
        if (item.received) {
            return item.receivedAt ? t("receivedOn", { date: dayjs(item.receivedAt).format("DD.MM") }) : t("received");
        }

        const status = paydayStatus(item.day);
        if (status === "today") return t("dueToday");
        return (
            <span className={status === "late" ? "text-amber-600 dark:text-amber-400" : undefined}>
                {t(status === "late" ? "late" : "onDay", { day: item.day })}
            </span>
        );
    };

    return (
        <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-muted-foreground text-[0.7rem] font-medium tracking-wide uppercase">
                    {t("progress", { received: summary.receivedCount, total: summary.total })}
                </p>
                <p className="text-sm font-medium tabular-nums">
                    {summary.pending > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                            {t("stillToCome")}: <AnimatedMoney value={summary.pending} symbol={symbol} />
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{t("allReceived")}</span>
                    )}
                </p>
            </div>

            <div className="bg-muted mb-4 h-1.5 w-full overflow-hidden rounded-full">
                <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <ul className="flex flex-col">
                {items.map((item) => (
                    <li key={item.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                            <Checkbox
                                checked={item.received}
                                onCheckedChange={() => setSelectedIncome(item)}
                                className="size-4 shrink-0 rounded-[5px] data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                            />
                            <span className="min-w-0 flex-1">
                                <span
                                    className={twMerge(
                                        "block truncate text-sm transition-colors",
                                        item.received && "text-muted-foreground",
                                    )}
                                >
                                    {item.title}
                                </span>
                                <span className="text-muted-foreground block text-[0.68rem]">
                                    {statusLine(item)}
                                    {!item.recurring && ` · ${t("oneOff")}`}
                                </span>
                            </span>
                            <span className="shrink-0 text-right">
                                <span
                                    className={twMerge(
                                        "block text-sm tabular-nums transition-colors",
                                        item.received
                                            ? "text-muted-foreground"
                                            : "font-medium text-emerald-600 dark:text-emerald-400",
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
                                        <span className="text-muted-foreground block text-[0.68rem] tabular-nums">
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
        </div>
    );
};
