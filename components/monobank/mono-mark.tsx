import { twMerge } from "lib/tw";

export const MonoMark = ({ className, textClassName }: { className?: string; textClassName?: string }) => (
    <span
        aria-hidden="true"
        className={twMerge("bg-ink text-paper flex size-11 shrink-0 items-center justify-center font-sans", className)}
    >
        <span className={twMerge("text-xs leading-none font-semibold tracking-tight", textClassName)}>mono</span>
    </span>
);
