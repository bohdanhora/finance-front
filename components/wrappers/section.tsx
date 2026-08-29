import { twMerge } from "tailwind-merge";

/**
 * One labelled block of the dashboard: a small heading on the left and the
 * block's actions on the right, then its content underneath.
 */
export const Section = ({
    title,
    actions,
    children,
    className,
    anchor,
}: {
    title: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    anchor?: string;
}) => {
    return (
        <section data-tour={anchor} className={twMerge("w-full", className)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">{title}</h2>
                {actions && <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
        </section>
    );
};

/** Four-across on desktop, two on tablets, stacked on phones. */
export const StatGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
);
