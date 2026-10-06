"use client";

import { useEffect, useId, useRef, useState } from "react";

import { twMerge } from "lib/tw";

export const Hint = ({ text }: { text: string }) => {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [alignEnd, setAlignEnd] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);

    const touchRef = useRef(false);

    useEffect(() => {
        if (!open) return;

        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) setAlignEnd(rect.left > window.innerWidth / 2);

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
                className="group/hint -m-2 inline-flex size-8 shrink-0 cursor-help items-center justify-center"
            >
                <span className="border-ink-faint text-ink-faint group-hover/hint:border-accent group-hover/hint:bg-accent group-hover/hint:text-on-accent flex size-3.5 items-center justify-center border font-mono text-3xs leading-none normal-case transition-colors">
                    i
                </span>
            </button>

            {open && (
                <span
                    id={id}
                    role="tooltip"
                    className={twMerge(
                        "border-rule-strong bg-paper text-ink pointer-events-none absolute top-full z-50 mt-2 w-tip border p-3 font-sans text-xs leading-relaxed font-normal tracking-normal normal-case",
                        alignEnd ? "-right-2" : "-left-2",
                    )}
                >
                    {text}
                </span>
            )}
        </span>
    );
};
