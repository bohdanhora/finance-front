"use client";

import { z } from "zod";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useForgotPassword } from "api/auth.api";
import { PublicProvider } from "providers/auth-provider";
import { Routes } from "constants/routes";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { AuthSectionWrapper } from "components/wrappers/auth-section-wrapper.component";
import { RenderEmailField } from "components/form-fields/email";
import { BackToLogin } from "components/back-to-login.component";
import { useForgotPasswordForm } from "./use-forgot-password-form";
import { forgotPasswordSchema } from "schemas/auth.schema";

export default function ResetPassword() {
    const tAuth = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: forgotPasswordAsync, isPending: forgotPasswordPending } = useForgotPassword();

    const form = useForgotPasswordForm(tAuth);
    const schema = useMemo(() => forgotPasswordSchema(tAuth), [tAuth]);
    type ForgotPasswordFormData = z.infer<typeof schema>;

    const onSubmit = async (values: ForgotPasswordFormData) => {
        await forgotPasswordAsync({ email: values.email.toLowerCase() });
        router.replace(Routes.LOGIN);
    };

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
