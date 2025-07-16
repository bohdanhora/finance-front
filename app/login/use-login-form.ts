import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { loginSchema } from "schemas/auth.schema";
import { z } from "zod";

export function useLoginForm(t: ReturnType<typeof import("next-intl").useTranslations>) {
    const schema = useMemo(() => loginSchema(t), [t]);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    return form;
}
