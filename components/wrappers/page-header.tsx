export const PageHeader = ({
    index,
    title,
    subtitle,
    actions,
}: {
    index: string;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}) => (
    <header className="border-rule-strong flex flex-col gap-5 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
            <p className="label">
                <span className="text-accent">{index}</span> / Finance
            </p>
            <h1 className="font-display mt-3 text-3xl leading-none font-medium tracking-tight uppercase sm:text-4xl">
                {title}
                <span className="caret caret-blink" aria-hidden="true" />
            </h1>
            {subtitle && <p className="text-ink-muted mt-3 max-w-xl text-sm leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
);

export const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="sheet">
        <div className="shell rise-stagger flex flex-col gap-14 pt-8 pb-28 sm:pb-20 md:gap-16 md:pt-10">{children}</div>
    </div>
);
