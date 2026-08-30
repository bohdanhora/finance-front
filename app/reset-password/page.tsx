"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { z } from "zod";

import { useResetPassword } from "api/auth";
import { Routes } from "constants/routes";
import { RenderPassword } from "components/form-fields/password";
import { BackToLogin } from "components/back-to-login";
import { authPrimaryButtonClass } from "components/form-fields/styles";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useResetPasswordForm } from "./use-reset-password-form";
import { resetPasswordSchema } from "schemas/auth";

type ResetPasswordData = z.infer<ReturnType<typeof resetPasswordSchema>>;

const ResetPassword = () => {
    const tAuth = useTranslations("auth");
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");

    const { mutateAsync: resetPasswordAsync, isPending } = useResetPassword();

    const form = useResetPasswordForm(tAuth);

    const onSubmit = async (values: ResetPasswordData) => {
        try {
            await resetPasswordAsync({ resetToken: token, newPassword: values.password });
            router.replace(Routes.LOGIN);
        } catch (error) {
            console.error(tAuth("resetPasswordRequestError"), error);
            toast.error(tAuth("resetPasswordError"));
        }
    };

    useEffect(() => {
        if (!token) {
            router.replace(Routes.LOGIN);
            toast.error(tAuth("missingToken"));
        }
    }, [router, tAuth, token]);

    return (
        <PublicProvider>
            <AuthSectionWrapper title={tAuth("resetPassword")} subtitle={tAuth("resetPasswordSubtitle")}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-stagger space-y-5">
                        <RenderPassword form={form} name="password" label="password" />
                        <RenderPassword form={form} name="confirmPassword" label="confirmPassword" />

                        <Button disabled={isPending} type="submit" className={authPrimaryButtonClass}>
                            {tAuth("resetBtn")}
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

export default ResetPassword;
