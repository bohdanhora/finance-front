"use client";

import { CheckedState } from "@radix-ui/react-checkbox";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { z } from "zod";

import { useLoginMutation } from "api/auth";
import { Routes } from "constants/routes";
import { loginSetTokens } from "lib/auth-helper";
import { extractTokensFromParams, showSessionToasts } from "lib/utils";
import { RenderEmailField } from "components/form-fields/email";
import { RenderPassword } from "components/form-fields/password";
import { authPrimaryButtonClass } from "components/form-fields/styles";
import { LoginOptions } from "components/login-options";
import { GoogleAuth } from "components/google-auth";
import { RegistrationWay } from "components/way-to-registration";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useLoginForm } from "./use-login-form";
import { loginSchema } from "schemas/auth";

type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;

const Login = () => {
    const tAuth = useTranslations("auth");
    const tApi = useTranslations("api");

    const searchParams = useSearchParams();
    const router = useRouter();

    const [rememberMe, setRememberMe] = useState<CheckedState>(false);

    const { mutateAsync: loginAsync, isPending } = useLoginMutation(rememberMe);

    const form = useLoginForm(tAuth);

    const onSubmit = async (values: LoginFormData) => {
        try {
            await loginAsync(values);
            router.replace(Routes.HOME);
        } catch (error) {
            console.error(tAuth("loginRequestError"), error);
            toast.error(tAuth("loginError"));
        }
    };

    useEffect(() => {
        showSessionToasts([
            { key: "showRegistrationToast", message: tApi("successRegistration") },
            { key: "showForgotPasswordToast", message: tApi("forgotPasswordSuccess") },
            { key: "showLogoutToast", message: tApi("logout") },
            { key: "showResetPasswordToast", message: tApi("resetPasswordSuccess") },
        ]);

        const tokens = extractTokensFromParams(searchParams);
        if (tokens) {
            loginSetTokens(tokens, false);
            router.replace(Routes.HOME);
        }
    }, [router, searchParams, tApi]);

    return (
        <PublicProvider>
            <AuthSectionWrapper title={tAuth("login")} subtitle={tAuth("loginSubTitle")}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-stagger space-y-5">
                        <RenderEmailField form={form} name="email" />
                        <RenderPassword form={form} name="password" label="password" autoComplete="current-password" />
                        <LoginOptions setRememberMe={setRememberMe} />
                        <Button type="submit" disabled={isPending} className={authPrimaryButtonClass}>
                            {isPending ? tAuth("signingIn") : tAuth("login")}
                        </Button>
                    </form>
                </Form>

                <div className="auth-delayed">
                    <div className="my-6 flex items-center gap-4">
                        <span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
                        <span className="text-[0.7rem] tracking-[0.15em] uppercase text-black/40 dark:text-white/40">
                            {tAuth("or")}
                        </span>
                        <span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
                    </div>

                    <GoogleAuth />

                    <div className="mt-7">
                        <RegistrationWay />
                    </div>
                </div>
            </AuthSectionWrapper>
        </PublicProvider>
    );
};

export default Login;
