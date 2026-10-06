import { twMerge } from "lib/tw";

export const Section = ({
    index,
    title,
    description,
    actions,
    children,
    className,
    anchor,
}: {
    index?: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    anchor?: string;
}) => {
    return (
        <section data-tour={anchor} className={twMerge("w-full scroll-mt-24", className)}>
            <header className="border-rule-strong flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b pb-3">
                <div className="flex min-w-0 items-baseline gap-3">
                    {index && (
                        <span aria-hidden="true" className="text-accent font-mono text-xs">
                            §{index}
                        </span>
                    )}
                    <h2 className="font-display min-w-0 text-lg leading-tight font-medium tracking-tight uppercase md:text-xl">
                        {title}
                    </h2>
                </div>
                {actions && <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">{actions}</div>}
            </header>
            {description && <p className="text-ink-muted mt-3 max-w-2xl text-sm leading-relaxed">{description}</p>}
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
            "border-rule grid grid-cols-2 border-t border-l lg:grid-cols-4 [&>*]:border-r [&>*]:border-b",
            className,
        )}
    >
        {children}
    </div>
);

export const SubHeading = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
    <div className="border-rule flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2">
        <h3 className="label text-ink">{children}</h3>
        {aside && <div className="text-sm tabular-nums">{aside}</div>}
    </div>
);
