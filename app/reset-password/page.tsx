"use client";

import { z } from "zod";

import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useTranslations } from "next-intl";
import { Routes } from "constants/routes";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useResetPassword } from "api/auth";
import { RenderPassword } from "components/form-fields/password";
import { BackToLogin } from "components/back-to-login";
import { useResetPasswordForm } from "./use-reset-password-form";
import { resetPasswordSchema } from "schemas/auth";
import { useToggle } from "hooks/use-toggle";

const ForgotPassword = () => {
    const tAuth = useTranslations("auth");
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");

    const { mutateAsync: resetPasswordAsync, isPending: resetPasswordPending } = useResetPassword();

    const [showPassword, toggleShowPassword] = useToggle(false);
    const [showConfirmPassword, toggleShowConfirmPassword] = useToggle(false);

    const form = useResetPasswordForm(tAuth);
    type ResetPasswordData = z.infer<ReturnType<typeof resetPasswordSchema>>;

    const onSubmit = async (values: ResetPasswordData) => {
        try {
            const body = {
                resetToken: token,
                newPassword: values.password,
            };

            await resetPasswordAsync(body);
            router.replace(Routes.LOGIN);
        } catch (error) {
            console.error(tAuth("resetPasswordRequestError"), error);
            form.setError("password", {
                type: "manual",
                message: tAuth("resetPasswordError"),
            });
        }
    };

    useEffect(() => {
        if (!token) {
            router.replace(Routes.LOGIN);
            toast.error(tAuth("missingToken"));
        }
    }, []);

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper title={tAuth("resetPassword")} subtitle={tAuth("resetPasswordSubtitle")}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <RenderPassword
                                form={form}
                                name="password"
                                label="password"
                                error={!!form.formState.errors.password}
                                showPassword={showPassword}
                                toggleShowPassword={toggleShowPassword}
                            />
                            <RenderPassword
                                form={form}
                                name="confirmPassword"
                                label="confirmPassword"
                                error={!!form.formState.errors.confirmPassword}
                                showPassword={showConfirmPassword}
                                toggleShowPassword={toggleShowConfirmPassword}
                            />

                            <Button disabled={resetPasswordPending} type="submit" className="w-full mb-5 py-4">
                                {tAuth("resetBtn")}
                            </Button>
                            <BackToLogin />
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
};

export default ForgotPassword;
