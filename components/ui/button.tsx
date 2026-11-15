import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { twMerge } from "lib/tw";

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[background-color,color,border-color,box-shadow,opacity] duration-150 outline-none disabled:pointer-events-none disabled:opacity-40 aria-invalid:outline aria-invalid:outline-signal [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    {
        variants: {
            variant: {
                default: "bg-ink text-paper hover:opacity-85",
                accent: "bg-accent text-on-accent shadow-glow hover:opacity-90",
                outline: "border border-rule-strong bg-transparent text-ink hover:border-ink-faint hover:bg-wash",
                secondary: "bg-wash text-ink hover:bg-rule",
                ghost: "text-ink-muted hover:bg-wash hover:text-ink",
                destructive: "bg-signal text-paper hover:opacity-90",
                popover: "border border-rule bg-surface font-normal text-ink hover:border-rule-strong",
                link: "h-auto rounded-none px-0 text-accent underline decoration-rule-strong underline-offset-4 hover:decoration-accent",
            },
            size: {
                default: "h-10 px-4",
                sm: "h-8 rounded-lg px-3 text-xs",
                lg: "h-12 px-5",
                icon: "size-9",
                "icon-sm": "size-8 rounded-lg",
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
