"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";
import { PublicProvider } from "providers/auth-provider";
import { useRegistrationMutation } from "api/auth.api";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { AuthSectionWrapper } from "components/wrappers/auth-section-wrapper.component";
import { Routes } from "constants/routes";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "components/password-input.component";
import useOtherStore from "store/other.store";
import { RenderEmailField } from "components/form-fields/email";

function useToggle(initial = false) {
    const [state, setState] = useState(initial);
    const toggle = () => setState((s) => !s);
    return [state, toggle] as const;
}

export default function Registration() {
    const otherStore = useOtherStore();

    const t = useTranslations("auth");
    const router = useRouter();

    const [showPassword, toggleShowPassword] = useToggle(false);
    const [showConfirmPassword, toggleShowConfirmPassword] = useToggle(false);

    const { mutateAsync: registrationAsync, isPending: registrationPending } = useRegistrationMutation();

    const formSchema = z
        .object({
            name: z.string().min(2, { message: t("errors.name") }),
            email: z.string().email({ message: t("errors.email") }),
            verificationCode: z.string().min(6, { message: t("errors.verificationCode") }),
            password: z.string().min(2, { message: t("errors.password") }),
            confirmPassword: z.string().min(2, { message: t("errors.confirmPassword") }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("errors.matchPasswords"),
            path: ["confirmPassword"],
        });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: otherStore.email,
            verificationCode: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(data: z.infer<typeof formSchema>) {
        await registrationAsync({
            name: data.name,
            email: data.email,
            password: data.password,
            verificationCode: data.verificationCode,
        });
        router.replace(Routes.LOGIN);
    }

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper title={t("registration")} subtitle={t("registrationSubTitle")}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("name")}</FormLabel>
                                        <FormControl>
                                            <Input className="px-5 py-6" placeholder={t("name")} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <RenderEmailField form={form} name="email" />

                            <FormField
                                control={form.control}
                                name="verificationCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("verificationCode")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="px-5 py-6"
                                                placeholder={t("verificationCode")}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <PasswordInput
                                        label={t("password")}
                                        placeholder={t("password")}
                                        error={!!form.formState.errors.password}
                                        value={field.value}
                                        onChange={field.onChange}
                                        show={showPassword}
                                        onToggleShow={toggleShowPassword}
                                        name={field.name}
                                    />
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <PasswordInput
                                        label={t("confirmPassword")}
                                        placeholder={t("confirmPassword")}
                                        error={!!form.formState.errors.confirmPassword}
                                        value={field.value}
                                        onChange={field.onChange}
                                        show={showConfirmPassword}
                                        onToggleShow={toggleShowConfirmPassword}
                                        name={field.name}
                                    />
                                )}
                            />

                            <Button disabled={registrationPending} type="submit" className="w-full mb-5 py-4">
                                {t("registration")}
                            </Button>

                            <div className="flex justify-center gap-1">
                                <span className="text-sm opacity-60">{t("backToLogin")}</span>
                                <Link
                                    href={Routes.LOGIN}
                                    className="text-sm font-medium hover:opacity-70 transition-all"
                                >
                                    {t("login")}
                                </Link>
                            </div>
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
}
