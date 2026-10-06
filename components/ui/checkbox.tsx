"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { twMerge } from "lib/tw";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={twMerge(
                "peer border-ink-faint bg-surface data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-on-accent aria-invalid:border-signal size-4 shrink-0 cursor-pointer border transition-colors outline-none hover:border-ink disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="flex items-center justify-center text-current transition-none"
            >
                <CheckIcon className="size-3" strokeWidth={3} />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
