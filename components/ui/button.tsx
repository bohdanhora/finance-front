import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
    "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[transform,box-shadow,background-color,border-color,filter] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:-translate-y-px hover:brightness-110 hover:shadow-lg active:translate-y-0 active:brightness-95",
                destructive:
                    "bg-rose-600 text-white shadow-md shadow-rose-500/20 hover:-translate-y-px hover:bg-rose-700 hover:shadow-lg active:translate-y-0 dark:bg-rose-500 dark:hover:bg-rose-600",
                outline:
                    "h-9 rounded-lg border border-indigo-500/40 bg-transparent text-indigo-700 hover:border-indigo-500 hover:bg-indigo-500/10 dark:border-indigo-400/40 dark:text-indigo-300 dark:hover:border-indigo-400 dark:hover:bg-indigo-400/10",
                secondary:
                    "border border-black/10 bg-black/[0.04] text-black/80 hover:bg-black/[0.07] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/[0.1]",
                ghost: "bg-transparent hover:bg-black/[0.06] hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white",
                popover: "bg-white dark:bg-zinc-500/10 border border-gray-300 dark:border-gray-600",
                link: "text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400",
            },
            size: {
                default: "px-4 py-2 has-[>svg]:px-3",
                sm: "rounded-md gap-1.5 px-3 py-2 has-[>svg]:px-2.5",
                lg: "rounded-md px-6 py-2 has-[>svg]:px-4",
                icon: "size-9",
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
