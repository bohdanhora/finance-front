import { twMerge } from "tailwind-merge";

export const MonoMark = ({ className, textClassName }: { className?: string; textClassName?: string }) => (
    <span
        aria-hidden="true"
        className={twMerge(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white ring-1 ring-black/10 shadow-sm dark:bg-white dark:text-zinc-950 dark:ring-white/20",
            className,
        )}
    >
        <span className={twMerge("text-[0.63rem] leading-none font-extrabold tracking-[-0.03em]", textClassName)}>
            mono
        </span>
    </span>
);
