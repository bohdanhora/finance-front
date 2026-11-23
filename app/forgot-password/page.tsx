"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";

import { useForgotPassword } from "api/auth";
import { Routes } from "constants/routes";
import { RenderEmailField } from "components/form-fields/email";
import { BackToLogin } from "components/back-to-login";
import { authPrimaryButtonClass, authSecondaryButtonClass } from "components/form-fields/styles";
import { authErrorCode } from "lib/auth-helper";
import useOtherStore from "store/other";
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
    const otherStore = useOtherStore();
    const [unverified, setUnverified] = useState(false);

    const onSubmit = async (values: ForgotPasswordFormData) => {
        setUnverified(false);
        try {
            await forgotPasswordAsync({ email: values.email.toLowerCase() });
            router.replace(Routes.LOGIN);
        } catch (error) {
            if (authErrorCode(error) === "EMAIL_UNVERIFIED") {
                setUnverified(true);
                return;
            }
            console.error(tAuth("forgotPasswordRequestError"), error);
            toast.error(tAuth("forgotPasswordError"));
        }
    };

    return (
        <PublicProvider>
            <AuthSectionWrapper title={tAuth("forgotPasswordTitle")}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-stagger space-y-5">
                        <RenderEmailField form={form} name="email" />

                        {unverified && (
                            <div className="border-warn space-y-3 border-l-2 py-1 pl-4">
                                <p className="text-ink-muted text-sm">{tAuth("forgotUnverified")}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={authSecondaryButtonClass}
                                    onClick={() => {
                                        otherStore.setEmail(form.getValues("email"));
                                        router.push(Routes.REGISTRATION);
                                    }}
                                >
                                    {tAuth("toRegistration")}
                                </Button>
                            </div>
                        )}

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
