import * as React from "react";

import { twMerge } from "lib/tw";
import { fieldClass } from "./input";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea data-slot="textarea" className={twMerge("flex min-h-16 py-2", fieldClass, className)} {...props} />
    );
}

export { Textarea };
