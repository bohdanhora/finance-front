import { twMerge } from "lib/tw";

export const BrandMark = ({ className }: { className?: string }) => (
    <span aria-hidden="true" className={twMerge("bg-ink relative block size-7 shrink-0", className)}>
        <span className="bg-accent absolute right-1/6 bottom-1/6 size-1/4" />
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
        <span className={twMerge("font-mono text-xs tracking-wide uppercase", wordmarkClassName)}>
            Finance
            <span className="caret caret-blink" aria-hidden="true" />
        </span>
    </span>
);
