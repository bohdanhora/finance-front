"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { Hint } from "./hint";
import { SafeToSpend } from "lib/pay-cycle";
import { formatCurrency, formatSignedCurrency } from "lib/utils";
import { CycleForecast } from "./charts/cycle-forecast";

const PACE_TONE = {
    over: { bar: "bg-signal", text: "text-signal" },
    onTrack: { bar: "bg-accent", text: "text-accent" },
    under: { bar: "bg-good", text: "text-good" },
} as const;

const share = (value: number, total: number) => (total > 0 ? Math.min(Math.max((value / total) * 100, 0), 100) : 0);

export const PayCyclePanel = ({ result, symbol }: { result: SafeToSpend; symbol: string }) => {
    const t = useTranslations("payCycle");
    const money = (value: number) => `${formatSignedCurrency(value)} ${symbol}`;

    const budget = Math.max(0, result.available + result.spentInCycle);
    const tone = PACE_TONE[result.pace];
    const payday = result.cycle.end.format("DD.MM");

    const parts = [
        { label: t("onCards"), value: result.own, sign: "" },
        { label: t("incoming"), value: result.incoming, sign: "+" },
        { label: t("bills"), value: result.bills, sign: "-" },
    ].filter((part, index) => index === 0 || part.value > 0);

    const paceValues = {
        pace: `${formatCurrency(result.dailyPace)} ${symbol}`,
        limit: `${formatCurrency(result.dailyLimit)} ${symbol}`,
    };
    const paceMessage =
        result.pace === "over"
            ? t("paceOver", paceValues)
            : result.pace === "under"
              ? t("paceUnder", paceValues)
              : t("paceOnTrack", paceValues);

    const last = result.projection[result.projection.length - 1];
    const pace = `${formatCurrency(result.dailyPace)} ${symbol}`;
    const forecastMessage = result.runsOutOn
        ? t("runsOut", {
              pace,
              date: result.runsOutOn.format("DD.MM"),
              days: result.cycle.end.diff(result.runsOutOn, "day"),
          })
        : last
          ? t("lastsUntilPayday", { pace, left: money(last.pace) })
          : null;
    const dip = !result.short && result.lowest && result.lowest.plan < 0 ? result.lowest : null;

    return (
        <div className="rounded-panel border-rule bg-surface mt-3 border p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-10">
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

                <div className="min-w-0">
                    <ul className="border-rule border-t text-sm lg:border-t-0">
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
                    {result.debt > 0 && (
                        <p className="border-warn text-ink-muted mt-2 border-l-2 py-0.5 pl-3 text-xs">
                            {result.cycle.anchored
                                ? t("debtNote", { amount: money(result.debt), date: payday })
                                : t("debtNoteNoPayday", { amount: money(result.debt) })}
                        </p>
                    )}
                </div>
            </div>

            {result.projection.length > 1 && (
                <div className="border-rule mt-5 border-t pt-4">
                    <p className="label mb-3 flex items-center gap-1.5">
                        <span className="min-w-0">{t("forecastTitle")}</span>
                        <Hint text={t("hintForecast")} />
                    </p>
                    <CycleForecast points={result.projection} symbol={symbol} />
                    {forecastMessage && (
                        <p className={twMerge("mt-3 text-sm", result.runsOutOn ? "text-signal" : "text-ink-muted")}>
                            {forecastMessage}
                        </p>
                    )}
                    {dip && (
                        <p className="text-warn mt-1 text-sm">
                            {t("dipWarning", { date: dip.date.format("DD.MM"), amount: money(dip.plan) })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
