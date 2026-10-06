"use client";

import { Hint } from "components/hint";

export const ConnectionCard = ({
    mark,
    title,
    status,
    connected,
    connectedLabel,
    note,
    children,
}: {
    mark: React.ReactNode;
    title: string;
    status: string;
    connected: boolean;
    connectedLabel: string;
    note: string;
    children: React.ReactNode;
}) => (
    <section className="border-rule-strong min-w-0 border-t">
        <div className="flex items-center gap-3 py-4">
            {mark}
            <div className="min-w-0 flex-1">
                <h2 className="font-display flex items-center gap-2 text-lg leading-tight font-medium tracking-tight uppercase">
                    {title}
                    <Hint text={note} />
                </h2>
                <p className="text-ink-faint mt-1 text-xs break-words">{status}</p>
            </div>
            {connected && (
                <span className="label text-accent flex shrink-0 items-center gap-1.5">
                    <span className="tick" />
                    {connectedLabel}
                </span>
            )}
        </div>

        <div className="border-rule min-w-0 border-t pt-4">{children}</div>
    </section>
);

export const KeyField = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
);
