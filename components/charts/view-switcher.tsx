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
                "no-scrollbar border-rule flex max-w-full overflow-x-auto border sm:inline-flex",
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
                            "border-rule min-h-9 shrink-0 border-l px-3 py-2 font-mono text-2xs whitespace-nowrap uppercase transition-colors first:border-l-0",
                            active ? "bg-ink text-paper" : "text-ink-faint hover:text-ink hover:bg-wash",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
