import { Hint } from "components/hint";

export const PageHeader = ({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}) => (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
            <div className="flex items-center gap-3">
                <h1 className="font-display text-4xl leading-none font-light tracking-tight sm:text-5xl">{title}</h1>
                {subtitle && <Hint text={subtitle} />}
            </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
);

export const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="sheet">
        <div className="shell rise-stagger flex flex-col gap-14 pt-8 pb-28 sm:pb-20 md:gap-16 md:pt-10">{children}</div>
    </div>
);
