"use client";

import { CheckedState } from "@radix-ui/react-checkbox";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

import { useLoginMutation } from "api/auth";
import { Routes } from "constants/routes";
import { loginSetTokens } from "lib/auth-helper";
import { extractTokensFromParams, showSessionToasts } from "lib/utils";
import { Loader } from "components/loader";
import { RenderEmailField } from "components/form-fields/email";
import { LoginPassword } from "components/form-fields/login-password";
import { LoginOptions } from "components/login-options";
import { GoogleAuth } from "components/google-auth";
import { RegistrationWay } from "components/way-to-registration";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useLoginForm } from "./use-login-form";
import { loginSchema } from "schemas/auth";
import { toast } from "react-toastify";

type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;

const Login = () => {
    const tAuth = useTranslations("auth");
    const tApi = useTranslations("api");

    const searchParams = useSearchParams();
    const router = useRouter();

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [rememberMe, setRememberMe] = useState<CheckedState>(false);

    const { mutateAsync: loginAsync, isPending: LoginPending } = useLoginMutation(rememberMe);

    const isLoading = isRedirecting || LoginPending;

    const form = useLoginForm(tAuth);

    const onSubmit = async (values: LoginFormData) => {
        try {
            setIsRedirecting(true);
            await loginAsync(values);
            router.replace(Routes.HOME);
        } catch (error) {
            console.error(tAuth("loginRequestError"), error);
            toast.error(tAuth("loginError"));
        } finally {
            setIsRedirecting(false);
        }
    };

    useEffect(() => {
        const toastMap = [
            {
                key: "showRegistrationToast",
                message: tApi("successRegistration"),
            },
            {
                key: "showForgotPasswordToast",
                message: tApi("forgotPasswordSuccess"),
            },
            {
                key: "showLogoutToast",
                message: tApi("logout"),
            },
            {
                key: "showResetPasswordToast",
                message: tApi("resetPasswordSuccess"),
            },
        ];

        showSessionToasts(toastMap);

        const tokens = extractTokensFromParams(searchParams);
        if (tokens) {
            loginSetTokens(tokens, false);
            router.replace(Routes.HOME);
        }
    }, []);

    if (isLoading) {
        return <Loader />;
    }

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper title={tAuth("login")} subtitle={tAuth("loginSubTitle")}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <RenderEmailField form={form} name="email" />
                            <LoginPassword form={form} name="password" />
                            <LoginOptions setRememberMe={setRememberMe} />
                            <Button type="submit" className="w-full py-4 mb-0">
                                {tAuth("login")}
                            </Button>
                            <GoogleAuth />
                            <RegistrationWay />
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
};

export default Login;
