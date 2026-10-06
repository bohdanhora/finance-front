import { twMerge } from "lib/tw";

import { Hint } from "./hint";

export const StatCard = ({
    label,
    value,
    secondary,
    action,
    hint,
    tone,
    className,
}: {
    label: string;
    value: React.ReactNode;
    secondary?: React.ReactNode;
    action?: React.ReactNode;
    hint?: string;
    tone?: "accent" | "signal";
    className?: string;
}) => {
    return (
        <div className={twMerge("bg-paper relative flex min-w-0 flex-col gap-2 p-4 sm:p-5", className)}>
            <div className="flex min-h-5 items-start justify-between gap-2">
                <p className="label flex min-w-0 items-center gap-1.5">
                    {tone && <span className={twMerge("tick", tone === "signal" && "bg-signal")} />}
                    <span className="min-w-0">{label}</span>
                    {hint && <Hint text={hint} />}
                </p>
                {action}
            </div>
            <p
                className={twMerge(
                    "figure text-figure min-w-0 truncate",
                    tone === "accent" && "text-accent",
                    tone === "signal" && "text-signal",
                )}
            >
                {value}
            </p>
            {secondary && <div className="text-ink-faint font-mono text-2xs tabular-nums">{secondary}</div>}
        </div>
    );
};
