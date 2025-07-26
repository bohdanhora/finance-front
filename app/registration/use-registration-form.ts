import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { registrationSchema } from "schemas/auth";
import { z } from "zod";

export function useRegistrationForm(t: ReturnType<typeof import("next-intl").useTranslations>, email: string) {
    const schema = useMemo(() => registrationSchema(t), [t]);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email,
            verificationCode: "",
            password: "",
            confirmPassword: "",
        },
    });

    return form;
}
