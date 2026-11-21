"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { Hint } from "./hint";
import { SafeToSpend } from "lib/pay-cycle";
import { formatSignedCurrency } from "lib/utils";

export const PayCyclePanel = ({ result, symbol }: { result: SafeToSpend; symbol: string }) => {
    const t = useTranslations("payCycle");
    const money = (value: number) => `${formatSignedCurrency(value)} ${symbol}`;

    const after = result.afterPayday;
    const payday = result.cycle.end.format("DD.MM");

    if (!after) {
        if (result.debt <= 0) return null;
        return (
            <div className="rounded-panel border-rule bg-surface mt-3 border p-4 sm:p-5">
                <p className="border-warn text-ink-muted border-l-2 py-0.5 pl-3 text-xs">
                    {t("debtNoteNoPayday", { amount: money(result.debt) })}
                </p>
            </div>
        );
    }

    const parts = [
        { label: t("available"), value: result.available, sign: "" },
        { label: t("salary", { date: payday }), value: after.salary, sign: "+" },
        { label: t("payOffCards"), value: after.debt, sign: "-" },
    ].filter((part, index) => index < 2 || part.value > 0);

    return (
        <div className="rounded-panel border-rule bg-surface mt-3 border p-4 sm:p-5">
            <p className="label flex items-center gap-1.5">
                <span className="min-w-0">{t("afterTitle", { date: payday })}</span>
                <Hint text={t("hintAfter")} />
            </p>
            <div className="mt-2 grid gap-4 lg:grid-cols-2 lg:gap-10">
                <ul className="border-rule border-t text-sm">
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
                        <span className="min-w-0">{t("afterLeft")}</span>
                        <span className={twMerge("font-mono text-xs tabular-nums", after.left < 0 && "text-signal")}>
                            {money(after.left)}
                        </span>
                    </li>
                </ul>
                <p
                    className={twMerge(
                        "self-start border-l-2 py-0.5 pl-3 text-xs",
                        after.atPace < 0 ? "border-signal text-signal" : "border-rule text-ink-muted",
                    )}
                >
                    {t("afterNote", { pace: money(result.dailyPace), left: money(after.atPace) })}
                </p>
            </div>
        </div>
    );
};
