"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";

/**
 * Small "why is this number what it is" explainer. Opens on hover and on
 * keyboard focus, so it is reachable without a pointer.
 */
export const Hint = ({ text }: { text: string }) => {
    const id = useId();
    const [open, setOpen] = useState(false);

    return (
        <span className="relative inline-flex">
            <button
                type="button"
                aria-label={text}
                aria-describedby={open ? id : undefined}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onClick={() => setOpen((prev) => !prev)}
                className="text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors"
            >
                <Info size={13} />
            </button>

            {open && (
                <span
                    id={id}
                    role="tooltip"
                    className="border-border bg-card text-foreground pointer-events-none absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border p-3 text-xs leading-relaxed font-normal normal-case shadow-xl"
                >
                    {text}
                </span>
            )}
        </span>
    );
};
