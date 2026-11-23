import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { loginSchema } from "schemas/auth";
import { z } from "zod";
import useOtherStore from "store/other";

export const useLoginForm = (t: ReturnType<typeof import("next-intl").useTranslations>) => {
    const schema = useMemo(() => loginSchema(t), [t]);

    const rememberedEmail = useOtherStore((state) => state.email);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            email: rememberedEmail,
            password: "",
        },
    });

    return form;
};
