import { extendTailwindMerge } from "tailwind-merge";

export const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: ["3xs", "2xs", "body", "figure", "hero"],
        },
    },
});
