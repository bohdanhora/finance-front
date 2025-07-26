"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { useRegistrationMutation } from "api/auth";
import { Routes } from "constants/routes";
import { RenderEmailField } from "components/form-fields/email";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import useOtherStore from "store/other";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { RenderPassword } from "components/form-fields/password";
import { BackToLogin } from "components/back-to-login";
import { RenderInputField } from "components/form-fields/input";
import { useRegistrationForm } from "./use-registration-form";
import { registrationSchema } from "schemas/auth";
import { useToggle } from "hooks/use-toggle";

export const Registration = () => {
    const otherStore = useOtherStore();

    const t = useTranslations("auth");
    const router = useRouter();

    const [showPassword, toggleShowPassword] = useToggle(false);
    const [showConfirmPassword, toggleShowConfirmPassword] = useToggle(false);

    const { mutateAsync: registrationAsync, isPending: registrationPending } = useRegistrationMutation();

    const form = useRegistrationForm(t, otherStore.email);
    type RegistrationFormData = z.infer<ReturnType<typeof registrationSchema>>;

    const onSubmit = async (data: RegistrationFormData) => {
        await registrationAsync({
            name: data.name,
            email: data.email,
            password: data.password,
            verificationCode: data.verificationCode,
        });
        router.replace(Routes.LOGIN);
    };

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper title={t("registration")} subtitle={t("registrationSubTitle")}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <RenderInputField form={form} name="name" label="name" />
                            <RenderEmailField form={form} name="email" />
                            <RenderInputField form={form} name="verificationCode" label="verificationCode" />
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

                            <Button disabled={registrationPending} type="submit" className="w-full mb-5 py-4">
                                {t("registration")}
                            </Button>
                            <BackToLogin />
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
};
