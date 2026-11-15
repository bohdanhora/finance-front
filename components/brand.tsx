import { twMerge } from "lib/tw";

export const BrandMark = ({ className }: { className?: string }) => (
    <span
        aria-hidden="true"
        className={twMerge(
            "bg-accent shadow-glow relative block size-7 shrink-0 overflow-hidden rounded-lg",
            className,
        )}
    >
        <span className="bg-paper absolute right-1/5 bottom-1/5 size-1/4 rounded-full" />
    </span>
);

export const Brand = ({
    className,
    markClassName,
    wordmarkClassName,
}: {
    className?: string;
    markClassName?: string;
    wordmarkClassName?: string;
}) => (
    <span className={twMerge("flex items-center gap-2.5", className)}>
        <BrandMark className={markClassName} />
        <span className={twMerge("text-base font-medium tracking-tight", wordmarkClassName)}>Finance</span>
    </span>
);
