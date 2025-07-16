"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth-provider";
import { useLoginMutation } from "api/auth.api";
import { Loader } from "components/loader.component";
import { useTranslations } from "next-intl";
import { Routes } from "constants/routes";
import { AuthSectionWrapper } from "components/wrappers/auth-section-wrapper.component";
import { useEffect, useMemo, useState } from "react";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSetTokens } from "lib/auth-helper";
import { RenderEmailField } from "components/form-fields/email";
import { LoginPassword } from "components/form-fields/login-password";
import { LoginOptions } from "components/login-options.component";
import { GoogleAuth } from "components/google-auth.component";
import { RegistrationWay } from "components/way-to-registration.component";
import { extractTokensFromParams, showSessionToasts } from "lib/utils";

export default function Login() {
    const tAuth = useTranslations("auth");
    const tApi = useTranslations("api");

    const searchParams = useSearchParams();
    const router = useRouter();

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [rememberMe, setRememberMe] = useState<CheckedState>(false);

    const { mutateAsync: loginAsync, isPending: LoginPending } = useLoginMutation(rememberMe);

    const isLoading = isRedirecting || LoginPending;

    const formSchema = useMemo(
        () =>
            z.object({
                email: z
                    .string()
                    .email({
                        message: tAuth("errors.email"),
                    })
                    .min(2),
                password: z.string().min(2, {
                    message: tAuth("errors.password"),
                }),
            }),
        [tAuth],
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsRedirecting(true);
            await loginAsync(values);
            router.replace(Routes.HOME);
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsRedirecting(false);
        }
    }

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
    }, []);

    useEffect(() => {
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
}
