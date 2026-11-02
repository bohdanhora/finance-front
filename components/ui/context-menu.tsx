"use client";

import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { twMerge } from "lib/tw";

function ContextMenu({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
    return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
    return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

function ContextMenuContent({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
    return (
        <ContextMenuPrimitive.Portal>
            <ContextMenuPrimitive.Content
                data-slot="context-menu-content"
                className={twMerge(
                    "bg-paper text-ink border-rule-strong z-50 max-h-(--radix-context-menu-content-available-height) min-w-48 origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto border p-1",
                    className,
                )}
                {...props}
            />
        </ContextMenuPrimitive.Portal>
    );
}

function ContextMenuLabel({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Label>) {
    return (
        <ContextMenuPrimitive.Label
            data-slot="context-menu-label"
            className={twMerge("label block max-w-64 truncate px-2 py-1.5", className)}
            {...props}
        />
    );
}

function ContextMenuItem({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & { variant?: "default" | "destructive" }) {
    return (
        <ContextMenuPrimitive.Item
            data-slot="context-menu-item"
            data-variant={variant}
            className={twMerge(
                "focus:bg-wash focus:text-ink data-[variant=destructive]:text-signal data-[variant=destructive]:focus:bg-signal-wash data-[variant=destructive]:*:[svg]:!text-signal [&_svg:not([class*='text-'])]:text-ink-faint relative flex min-h-11 cursor-pointer items-center gap-2.5 px-2 py-2 text-sm outline-hidden select-none sm:min-h-9 sm:py-1.5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}
        />
    );
}

function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
    return (
        <ContextMenuPrimitive.Separator
            data-slot="context-menu-separator"
            className={twMerge("bg-rule -mx-1 my-1 h-px", className)}
            {...props}
        />
    );
}

export { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger };
