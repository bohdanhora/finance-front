import { twMerge } from "tailwind-merge";

import { Hint } from "./hint";

/**
 * A single figure on the dashboard: quiet label on top, the number below, an
 * optional converted value, and room for a small inline action.
 */
export const StatCard = ({
    label,
    value,
    secondary,
    action,
    hint,
    className,
}: {
    label: string;
    value: string;
    secondary?: string;
    action?: React.ReactNode;
    hint?: string;
    className?: string;
}) => {
    return (
        <div
            className={twMerge(
                "group border-border bg-card relative flex flex-col gap-1 rounded-2xl border p-5",
                "shadow-sm transition-[transform,box-shadow,border-color] duration-300",
                "hover:-translate-y-0.5 hover:shadow-md",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-[0.7rem] font-medium tracking-wide uppercase">
                    {label}
                    {hint && <Hint text={hint} />}
                </p>
                {action}
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
            {secondary && <p className="text-muted-foreground text-sm tabular-nums">{secondary}</p>}
        </div>
    );
};
