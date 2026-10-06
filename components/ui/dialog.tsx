"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { twMerge } from "lib/tw";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={twMerge("bg-scrim fixed inset-0 z-50", className)}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={twMerge(
                    "dialog-frame bg-paper text-ink fixed inset-x-0 z-50 grid w-full gap-5 overflow-y-auto overscroll-contain border-t border-rule-strong px-4 pt-5 pb-5 outline-none sm:inset-x-auto sm:left-1/2 sm:w-11/12 sm:max-w-dialog sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border sm:px-6 sm:pt-6 sm:pb-6",
                    className,
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className="text-ink-muted hover:border-rule-strong hover:text-ink absolute top-4 right-4 flex size-8 cursor-pointer items-center justify-center border border-rule transition-colors disabled:pointer-events-none sm:top-5 sm:right-5"
                    >
                        <XIcon className="size-3.5" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={twMerge("flex flex-col gap-2 border-b border-rule-strong pr-10 pb-4 text-left", className)}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-footer"
            className={twMerge(
                "mt-1 flex flex-col-reverse gap-2 border-t border-rule pt-4 sm:flex-row sm:justify-end",
                className,
            )}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={twMerge("font-display text-lg leading-tight font-medium tracking-tight uppercase", className)}
            {...props}
        />
    );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={twMerge("text-ink-muted text-sm leading-relaxed", className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
