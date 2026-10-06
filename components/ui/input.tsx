import * as React from "react";

import { twMerge } from "lib/tw";

export const fieldClass = [
    "w-full min-w-0 border border-rule bg-surface px-3 text-base text-ink outline-none md:text-sm",
    "placeholder:text-ink-faint transition-colors duration-150",
    "hover:border-ink-faint focus-visible:border-accent focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-accent",
    "aria-invalid:border-signal aria-invalid:outline-signal",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={twMerge(
                "flex h-11 py-1 tabular-nums",
                fieldClass,
                "file:text-ink file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
