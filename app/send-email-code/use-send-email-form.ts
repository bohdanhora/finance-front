import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { sendEmailSchema } from "schemas/auth";
import { z } from "zod";

export function useSendEmailForm(t: ReturnType<typeof import("next-intl").useTranslations>) {
    const schema = useMemo(() => sendEmailSchema(t), [t]);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
        },
    });

    return form;
}
