"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";

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
    <div className="border-border/80 from-muted/35 overflow-hidden rounded-2xl border bg-gradient-to-b to-transparent">
        <div className="flex items-center gap-3 p-4">
            {mark}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-muted-foreground truncate text-xs">{status}</p>
            </div>
            {connected && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    {connectedLabel}
                </span>
            )}
        </div>

        <div className="border-border/70 min-w-0 border-t p-4">{children}</div>

        <div className="border-border/70 bg-muted/25 flex items-start gap-2.5 border-t px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-muted-foreground text-xs leading-relaxed">{note}</p>
        </div>
    </div>
);

export const KeyField = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
);
