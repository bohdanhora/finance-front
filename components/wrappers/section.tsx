import { twMerge } from "lib/tw";
import { Hint } from "components/hint";

export const Section = ({
    title,
    description,
    actions,
    children,
    className,
    anchor,
}: {
    title: React.ReactNode;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    anchor?: string;
}) => {
    return (
        <section data-tour={anchor} className={twMerge("w-full scroll-mt-24", className)}>
            <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <h2 className="font-display min-w-0 text-xl leading-tight font-medium tracking-tight md:text-2xl">
                        {title}
                    </h2>
                    {description && (
                        <span className="self-center">
                            <Hint text={description} />
                        </span>
                    )}
                </div>
                {actions && <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">{actions}</div>}
            </header>
            <div className="mt-5">{children}</div>
        </section>
    );
};

export const StatGrid = ({
    children,
    className,
    anchor,
}: {
    children: React.ReactNode;
    className?: string;
    anchor?: string;
}) => (
    <div
        data-tour={anchor}
        className={twMerge(
            "grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 [&>*]:rounded-panel [&>*]:border [&>*]:border-rule [&>*]:bg-surface",
            className,
        )}
    >
        {children}
    </div>
);

export const SubHeading = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-1">
        <h3 className="label text-ink">{children}</h3>
        {aside && <div className="text-sm tabular-nums">{aside}</div>}
    </div>
);
