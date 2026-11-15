"use client";

import { twMerge } from "lib/tw";

export type SwitcherOption<T extends string> = {
    value: T;
    label: string;
};

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
                "no-scrollbar bg-wash flex max-w-full gap-1 overflow-x-auto rounded-xl p-1 sm:inline-flex",
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
                            "min-h-8 shrink-0 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                            active ? "bg-surface text-ink shadow-lg" : "text-ink-muted hover:text-ink",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
