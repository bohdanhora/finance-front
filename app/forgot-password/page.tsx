"use client";

import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useForgotPassword } from "api/auth";
import { PublicProvider } from "providers/auth";
import { Routes } from "constants/routes";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { RenderEmailField } from "components/form-fields/email";
import { BackToLogin } from "components/back-to-login";
import { useForgotPasswordForm } from "./use-forgot-password-form";
import { forgotPasswordSchema } from "schemas/auth";
import { toast } from "react-toastify";

type ForgotPasswordFormData = z.infer<ReturnType<typeof forgotPasswordSchema>>;

const ResetPassword = () => {
    const tAuth = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: forgotPasswordAsync, isPending: forgotPasswordPending } = useForgotPassword();

    const form = useForgotPasswordForm(tAuth);

    const onSubmit = async (values: ForgotPasswordFormData) => {
        try {
            await forgotPasswordAsync({ email: values.email.toLowerCase() });
            router.replace(Routes.LOGIN);
        } catch (error) {
            console.error(tAuth("forgotPasswordRequestError"), error);
            toast.error(tAuth("loginError"));
        }
    };

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper title={tAuth("forgotPasswordTitle")} subtitle={tAuth("forgotPasswordSubtitle")}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <RenderEmailField form={form} name="email" />
                            <Button
                                disabled={forgotPasswordPending || !form.watch("email") || !form.formState.isValid}
                                type="submit"
                                className="w-full mb-5 py-4"
                            >
                                {tAuth("sendEmail")}
                            </Button>
                            <BackToLogin />
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
};

export default ResetPassword;
