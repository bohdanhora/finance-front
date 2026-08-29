import * as React from "react";

import { twMerge } from "tailwind-merge";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={twMerge(
                "flex h-10 w-full min-w-0 rounded-lg px-3 py-1 text-base outline-none",
                "transition-[border-color,box-shadow,background-color] duration-200",
                "border-input bg-black/[0.02] text-foreground placeholder:text-muted-foreground border dark:bg-white/[0.04]",
                "focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                "dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-400/20",
                "aria-invalid:border-red-500 aria-invalid:ring-4 aria-invalid:ring-red-500/15",
                "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
