import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { twMerge } from "lib/tw";

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-mono text-2xs uppercase tracking-wide transition-colors duration-150 outline-none disabled:pointer-events-none disabled:opacity-40 aria-invalid:outline aria-invalid:outline-signal [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    {
        variants: {
            variant: {
                default: "bg-ink text-paper hover:bg-accent hover:text-on-accent",
                accent: "bg-accent text-on-accent hover:bg-ink hover:text-paper",
                outline:
                    "border border-rule-strong bg-transparent text-ink hover:border-accent hover:bg-accent hover:text-on-accent",
                secondary: "border border-rule bg-surface text-ink hover:border-rule-strong",
                ghost: "text-ink-muted hover:bg-wash hover:text-ink",
                destructive: "bg-signal text-paper hover:bg-ink",
                popover:
                    "border border-rule bg-surface font-sans text-sm tracking-normal normal-case text-ink hover:border-ink-faint",
                link: "h-auto px-0 text-accent underline decoration-rule underline-offset-4 hover:decoration-accent",
            },
            size: {
                default: "h-10 px-4",
                sm: "h-8 px-3",
                lg: "h-12 px-5 text-xs",
                icon: "size-9",
                "icon-sm": "size-8",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : "button";

    return <Comp data-slot="button" className={twMerge(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
