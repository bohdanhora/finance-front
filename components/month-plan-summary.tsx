"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { MonthPlan, summarizeEssentials, summarizeExpectedIncomes } from "lib/month-plan";
import { formatCurrency } from "lib/utils";

type PlanRow = {
    id: string;
    title: string;
    planned: number;
    /** What actually happened, or null when it never did. */
    actual: number | null;
};

const PlanCard = ({
    title,
    headline,
    progress,
    rows,
    emptyLabel,
    missingLabel,
    planLabel,
    money,
}: {
    title: string;
    headline: string;
    progress: number;
    rows: PlanRow[];
    emptyLabel: string;
    missingLabel: string;
    planLabel: (amount: number) => string;
    money: (amount: number) => string;
}) => (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-5 shadow-sm">
        <p className="text-muted-foreground text-[0.7rem] font-medium tracking-wide uppercase">{title}</p>
        {rows.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">{emptyLabel}</p>
        ) : (
            <>
                <p className="mt-1 text-base font-semibold tabular-nums">{headline}</p>
                <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <ul className="divide-border mt-3 max-h-80 divide-y overflow-y-auto">
                    {rows.map((row) => {
                        const differs = row.actual !== null && Math.abs(row.actual - row.planned) >= 0.01;

                        return (
                            <li key={row.id} className="flex items-center justify-between gap-4 py-2.5">
                                <span className="min-w-0 truncate text-sm">{row.title}</span>
                                <span className="shrink-0 text-right">
                                    <span
                                        className={twMerge(
                                            "block text-sm tabular-nums",
                                            row.actual === null ? "text-amber-600 dark:text-amber-400" : "font-medium",
                                        )}
                                    >
                                        {row.actual === null ? missingLabel : money(row.actual)}
                                    </span>
                                    {(differs || row.actual === null) && (
                                        <span className="text-muted-foreground block text-[0.68rem] tabular-nums">
                                            {planLabel(row.planned)}
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </>
        )}
    </div>
);

const share = (actual: number, planned: number) => (planned > 0 ? Math.min((actual / planned) * 100, 100) : 0);

/** Expected income and essential payments, each planned against what really happened. */
export const MonthPlanSummary = ({ plan, symbol }: { plan: MonthPlan; symbol: string }) => {
    const t = useTranslations("statistics");
    const money = (amount: number) => `${formatCurrency(amount)} ${symbol}`;
    const planLabel = (amount: number) => t("planShort", { amount: money(amount) });

    const incomes = summarizeExpectedIncomes(plan.expectedIncomes);
    const essentials = summarizeEssentials(plan.essentials);

    return (
        <div className="grid gap-3 lg:grid-cols-2">
            <PlanCard
                title={t("expectedIncome")}
                headline={t("receivedOfPlanned", {
                    received: money(incomes.received),
                    planned: money(incomes.planned),
                })}
                progress={share(incomes.received, incomes.planned)}
                rows={plan.expectedIncomes.map((item) => ({
                    id: item.id,
                    title: item.title,
                    planned: item.amount,
                    actual: item.received ? (item.receivedAmount ?? item.amount) : null,
                }))}
                emptyLabel={t("noIncomePlan")}
                missingLabel={t("notReceived")}
                planLabel={planLabel}
                money={money}
            />
            <PlanCard
                title={t("essentialsPlan")}
                headline={t("paidOfPlanned", { paid: money(essentials.paid), planned: money(essentials.planned) })}
                progress={share(essentials.paid, essentials.planned)}
                rows={plan.essentials.map((item) => ({
                    id: item.id,
                    title: item.title,
                    planned: item.amount,
                    actual: item.checked ? (item.paidAmount ?? item.amount) : null,
                }))}
                emptyLabel={t("noEssentialsPlan")}
                missingLabel={t("notPaid")}
                planLabel={planLabel}
                money={money}
            />
        </div>
    );
};
