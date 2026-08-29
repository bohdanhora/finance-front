"use client";

import { twMerge } from "tailwind-merge";

export type SwitcherOption<T extends string> = {
    value: T;
    label: string;
};

/** Segmented control: a quieter, quicker alternative to a dropdown. */
export const ViewSwitcher = <T extends string>({
    options,
    value,
    onChange,
    className,
}: {
    options: SwitcherOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}) => {
    return (
        <div
            role="tablist"
            className={twMerge(
                "border-border bg-muted/60 flex max-w-full gap-1 overflow-x-auto rounded-xl border p-1",
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:overflow-visible",
                className,
            )}
        >
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <button
                        key={option.value}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={twMerge(
                            "min-h-9 shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
                            active
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
