"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth-provider";
import { useTranslations } from "next-intl";
import { Routes } from "constants/routes";
import { AuthSectionWrapper } from "components/wrappers/auth-section-wrapper.component";
import { useForgotPassword } from "api/auth.api";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { RenderEmailField } from "components/form-fields/email";
import { BackToLogin } from "components/back-to-login.component";

export default function ResetPassword() {
    const tAuth = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: forgotPasswordAsync, isPending: forgotPasswordPending } = useForgotPassword();

    const formSchema = useMemo(
        () =>
            z.object({
                email: z
                    .string()
                    .email({
                        message: tAuth("errors.email"),
                    })
                    .min(2),
            }),
        [tAuth],
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        await forgotPasswordAsync({ email: values.email.toLowerCase() });
        router.replace(Routes.LOGIN);
    }

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper title={tAuth("forgotPasswordTitle")} subtitle={tAuth("forgotPasswordSubtitle")}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <RenderEmailField form={form} name="email" />
                            <Button disabled={forgotPasswordPending} type="submit" className="w-full mb-5 py-4">
                                {tAuth("sendEmail")}
                            </Button>
                            <BackToLogin />
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
}
