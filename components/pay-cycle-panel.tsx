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

    const tone = PACE_TONE[result.pace];
    const scale = Math.max(result.dailyPace, result.dailyLimit) * 1.25;
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
    const big = result.typical.bigCount > 0;
    const paceSource = big
        ? t("typicalSourceBig", {
              days: result.typical.days,
              count: result.typical.bigCount,
              amount: money(result.typical.bigTotal),
          })
        : t("typicalSource", { days: result.typical.days });
    const after = result.afterPayday;
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
                        <span className="min-w-0">
                            {result.cycle.anchored ? t("untilTitle", { date: payday }) : t("available")}
                        </span>
                        <Hint text={t("hintAvailable")} />
                    </p>
                    <ul className="border-rule mt-2 border-t text-sm">
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
                    <div className="border-rule mt-5 border-t pt-4">
                        <p className="label flex items-center gap-1.5">
                            <span className="min-w-0">{t("paceTitle")}</span>
                            <Hint text={t("hintPace")} />
                        </p>
                        <p className="mt-2 text-sm tabular-nums">
                            <span className="font-medium">{t("typical", { amount: money(result.dailyPace) })}</span>
                            <span className="text-ink-faint">
                                {" "}
                                · {t("limitPerDay", { amount: money(result.dailyLimit) })}
                            </span>
                        </p>
                        <div className="bg-wash relative mt-3 h-2 rounded-full">
                            <div
                                className={twMerge("h-full rounded-full transition-[width] duration-500", tone.bar)}
                                style={{ width: `${share(result.dailyPace, scale)}%` }}
                            />
                            <span
                                className="bg-ink absolute -top-1 h-4 w-0.5 rounded-full"
                                style={{ left: `${share(result.dailyLimit, scale)}%` }}
                            />
                        </div>
                        <p className="text-ink-faint mt-1.5 text-xs">{paceSource}</p>
                        <p className={twMerge("mt-2 text-sm", tone.text)}>{paceMessage}</p>
                    </div>
                </div>

                <div className="min-w-0">
                    {after ? (
                        <div>
                            <p className="label flex items-center gap-1.5">
                                <span className="min-w-0">{t("afterTitle", { date: payday })}</span>
                                <Hint text={t("hintAfter")} />
                            </p>
                            <ul className="border-rule mt-2 border-t text-sm">
                                {[
                                    { label: t("available"), value: result.available, sign: "" },
                                    { label: t("salary", { date: payday }), value: after.salary, sign: "+" },
                                    { label: t("payOffCards"), value: after.debt, sign: "-" },
                                ]
                                    .filter((part, index) => index < 2 || part.value > 0)
                                    .map((part) => (
                                        <li
                                            key={part.label}
                                            className="border-rule flex justify-between gap-4 border-b py-1.5"
                                        >
                                            <span className="text-ink-muted min-w-0">{part.label}</span>
                                            <span className="font-mono text-xs tabular-nums">
                                                {part.sign}
                                                {money(part.value)}
                                            </span>
                                        </li>
                                    ))}
                                <li className="flex justify-between gap-4 py-1.5 font-medium">
                                    <span className="min-w-0">{t("afterLeft")}</span>
                                    <span
                                        className={twMerge(
                                            "font-mono text-xs tabular-nums",
                                            after.left < 0 && "text-signal",
                                        )}
                                    >
                                        {money(after.left)}
                                    </span>
                                </li>
                            </ul>
                            <p
                                className={twMerge(
                                    "mt-2 border-l-2 py-0.5 pl-3 text-xs",
                                    after.atPace < 0 ? "border-signal text-signal" : "border-rule text-ink-muted",
                                )}
                            >
                                {t("afterNote", { pace: money(result.dailyPace), left: money(after.atPace) })}
                            </p>
                        </div>
                    ) : (
                        result.debt > 0 && (
                            <p className="border-warn text-ink-muted mt-2 border-l-2 py-0.5 pl-3 text-xs">
                                {t("debtNoteNoPayday", { amount: money(result.debt) })}
                            </p>
                        )
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
