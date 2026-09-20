"use client";

import { ReactNode } from "react";
import { z } from "zod";

import { createZodErrorMap, useValidationMessages } from "lib/validation";

export const ValidationProvider = ({ children }: { children: ReactNode }) => {
    const messages = useValidationMessages();

    if (typeof window !== "undefined") {
        z.config({ customError: createZodErrorMap(messages) });
    }

    return children;
};
