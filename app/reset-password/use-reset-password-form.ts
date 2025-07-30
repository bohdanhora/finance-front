import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { resetPasswordSchema } from "schemas/auth";
import { z } from "zod";

export const useResetPasswordForm = (t: ReturnType<typeof import("next-intl").useTranslations>) => {
    const schema = useMemo(() => resetPasswordSchema(t), [t]);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    return form;
};
