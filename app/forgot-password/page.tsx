"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";

import { useForgotPassword } from "api/auth";
import { Routes } from "constants/routes";
import { RenderEmailField } from "components/form-fields/email";
import { BackToLogin } from "components/back-to-login";
import { authPrimaryButtonClass } from "components/form-fields/styles";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useForgotPasswordForm } from "./use-forgot-password-form";
import { forgotPasswordSchema } from "schemas/auth";

type ForgotPasswordFormData = z.infer<ReturnType<typeof forgotPasswordSchema>>;

const ForgotPassword = () => {
    const tAuth = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: forgotPasswordAsync, isPending } = useForgotPassword();

    const form = useForgotPasswordForm(tAuth);

    const onSubmit = async (values: ForgotPasswordFormData) => {
        try {
            await forgotPasswordAsync({ email: values.email.toLowerCase() });
            router.replace(Routes.LOGIN);
        } catch (error) {
            console.error(tAuth("forgotPasswordRequestError"), error);
            toast.error(tAuth("forgotPasswordError"));
        }
    };

    return (
        <PublicProvider>
            <AuthSectionWrapper title={tAuth("forgotPasswordTitle")} subtitle={tAuth("forgotPasswordSubtitle")}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-stagger space-y-5">
                        <RenderEmailField form={form} name="email" />

                        <Button
                            disabled={isPending || !form.formState.isValid}
                            type="submit"
                            className={authPrimaryButtonClass}
                        >
                            {tAuth("sendEmail")}
                        </Button>
                    </form>
                </Form>

                <div className="auth-delayed mt-7">
                    <BackToLogin />
                </div>
            </AuthSectionWrapper>
        </PublicProvider>
    );
};

export default ForgotPassword;
