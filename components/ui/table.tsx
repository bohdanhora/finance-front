"use client";

import * as React from "react";
import { twMerge } from "lib/tw";

function Table({ className, ...props }: React.ComponentProps<"table">) {
    return (
        <div data-slot="table-container" className="relative w-full overflow-x-auto">
            <table
                data-slot="table"
                className={twMerge("w-full caption-bottom text-sm tabular-nums", className)}
                {...props}
            />
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
    return (
        <thead
            data-slot="table-header"
            className={twMerge("[&_tr]:border-b [&_tr]:border-rule-strong [&_tr]:hover:bg-transparent", className)}
            {...props}
        />
    );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
    return <tbody data-slot="table-body" className={twMerge("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
    return (
        <tfoot
            data-slot="table-footer"
            className={twMerge("border-t border-rule-strong font-medium [&>tr]:last:border-b-0", className)}
            {...props}
        />
    );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
    return (
        <tr
            data-slot="table-row"
            className={twMerge(
                "hover:bg-surface data-[state=selected]:bg-wash border-b border-rule transition-colors",
                className,
            )}
            {...props}
        />
    );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
    return (
        <th
            data-slot="table-head"
            className={twMerge(
                "label h-9 px-2 text-left align-middle font-normal whitespace-nowrap [&:has([role=checkbox])]:pr-0",
                className,
            )}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
    return (
        <td
            data-slot="table-cell"
            className={twMerge("px-2 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0", className)}
            {...props}
        />
    );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
    return (
        <caption data-slot="table-caption" className={twMerge("text-ink-faint mt-4 text-sm", className)} {...props} />
    );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
