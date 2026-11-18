"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { Hint } from "./hint";
import { SafeToSpend } from "lib/pay-cycle";
import { formatCurrency } from "lib/utils";

const PACE_TONE = {
    over: { bar: "bg-signal", text: "text-signal" },
    onTrack: { bar: "bg-accent", text: "text-accent" },
    under: { bar: "bg-good", text: "text-good" },
} as const;

const share = (value: number, total: number) => (total > 0 ? Math.min(Math.max((value / total) * 100, 0), 100) : 0);

export const PayCyclePanel = ({ result, symbol }: { result: SafeToSpend; symbol: string }) => {
    const t = useTranslations("payCycle");
    const money = (value: number) => `${formatCurrency(value)} ${symbol}`;

    const budget = Math.max(0, result.available + result.spentInCycle);
    const gap = Math.abs(result.spentInCycle - result.plannedByNow);
    const tone = PACE_TONE[result.pace];

    const parts = [
        { label: t("onCards"), value: result.balance, sign: "" },
        { label: t("incoming"), value: result.incoming, sign: "+" },
        { label: t("bills"), value: result.bills, sign: "−" },
        { label: t("savings"), value: result.savings, sign: "−" },
    ].filter((part, index) => index === 0 || part.value > 0);

    const paceMessage =
        result.pace === "over"
            ? t("paceOver", { amount: money(gap) })
            : result.pace === "under"
              ? t("paceUnder", { amount: money(gap) })
              : t("paceOnTrack");

    return (
        <div className="rounded-panel border-rule bg-surface mt-3 grid gap-5 border p-4 sm:p-5 lg:grid-cols-2 lg:gap-10">
            <div className="min-w-0">
                <p className="label flex items-center gap-1.5">
                    <span className="min-w-0">{t("paceTitle", { date: result.cycle.start.format("DD.MM") })}</span>
                    <Hint text={t("hintPace")} />
                </p>
                <p className="mt-2 text-sm tabular-nums">
                    <span className="font-medium">{t("spent", { amount: money(result.spentInCycle) })}</span>
                    <span className="text-ink-faint">
                        {" "}
                        · {t("plannedByNow", { amount: money(result.plannedByNow) })}
                    </span>
                </p>
                <div className="bg-wash relative mt-3 h-2 rounded-full">
                    <div
                        className={twMerge("h-full rounded-full transition-[width] duration-500", tone.bar)}
                        style={{ width: `${share(result.spentInCycle, budget)}%` }}
                    />
                    <span
                        className="bg-ink absolute -top-1 h-4 w-0.5 rounded-full"
                        style={{ left: `${share(result.plannedByNow, budget)}%` }}
                    />
                </div>
                <p className={twMerge("mt-2 text-sm", tone.text)}>{paceMessage}</p>
            </div>

            <ul className="border-rule min-w-0 border-t text-sm lg:border-t-0">
                {parts.map((part) => (
                    <li key={part.label} className="border-rule flex justify-between gap-4 border-b py-1.5">
                        <span className="text-ink-muted min-w-0">{part.label}</span>
                        <span className="font-mono text-xs tabular-nums">
                            {part.sign}
                            {money(part.value)}
                        </span>
                    </li>
                ))}
                <li className="flex justify-between gap-4 py-1.5 font-medium">
                    <span className="min-w-0">{t("available")}</span>
                    <span className={twMerge("font-mono text-xs tabular-nums", result.short && "text-signal")}>
                        {money(result.available)}
                    </span>
                </li>
            </ul>
        </div>
    );
};
