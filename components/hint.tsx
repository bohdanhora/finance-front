"use client";

import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Small "why is this number what it is" explainer. Opens on hover, on keyboard
 * focus and on tap, so it is reachable with a pointer, a keyboard and a finger.
 */
export const Hint = ({ text }: { text: string }) => {
    const id = useId();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);

    /**
     * Mobile browsers fire mouseenter and focus on a tap, immediately before the
     * click. With hover and click both flipping the same flag the hint opened
     * and closed again within the same tap, so it never appeared on a phone.
     * Hover and focus are honoured only for a real mouse or a keyboard.
     */
    const touchRef = useRef(false);

    // A phone has no "mouse leave", so a tapped hint would stay open until the
    // same icon was tapped again. Anywhere else on the page closes it too.
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <span ref={wrapperRef} className="relative inline-flex">
            <button
                type="button"
                aria-label={text}
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                onPointerDown={(event) => {
                    touchRef.current = event.pointerType !== "mouse";
                }}
                onMouseEnter={() => !touchRef.current && setOpen(true)}
                onMouseLeave={() => !touchRef.current && setOpen(false)}
                onFocus={() => !touchRef.current && setOpen(true)}
                onBlur={() => !touchRef.current && setOpen(false)}
                onClick={() => touchRef.current && setOpen((prev) => !prev)}
                /* -m-2 keeps the 32px tap target from changing the label's layout. */
                className="text-muted-foreground/60 hover:text-muted-foreground -m-2 inline-flex size-8 cursor-help items-center justify-center transition-colors"
            >
                <Info size={13} />
            </button>

            {open && (
                <span
                    id={id}
                    role="tooltip"
                    className="border-border bg-card text-foreground pointer-events-none absolute top-full right-0 z-50 mt-2 w-[min(14rem,calc(100vw-3rem))] rounded-xl border p-3 text-xs leading-relaxed font-normal normal-case shadow-xl"
                >
                    {text}
                </span>
            )}
        </span>
    );
};
