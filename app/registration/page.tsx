"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";

import { useRegistrationMutation } from "api/auth";
import { Routes } from "constants/routes";
import { RenderEmailField } from "components/form-fields/email";
import { RenderInputField } from "components/form-fields/input";
import { RenderPassword } from "components/form-fields/password";
import { BackToLogin } from "components/back-to-login";
import { authPrimaryButtonClass } from "components/form-fields/styles";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import useOtherStore from "store/other";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useRegistrationForm } from "./use-registration-form";
import { registrationSchema } from "schemas/auth";

type RegistrationFormData = z.infer<ReturnType<typeof registrationSchema>>;

const Registration = () => {
    const otherStore = useOtherStore();

    const t = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: registrationAsync, isPending } = useRegistrationMutation();

    const form = useRegistrationForm(t, otherStore.email);

    const onSubmit = async (data: RegistrationFormData) => {
        try {
            await registrationAsync({
                name: data.name,
                email: data.email,
                password: data.password,
                verificationCode: data.verificationCode,
            });
            router.replace(Routes.LOGIN);
        } catch (error) {
            console.error(t("registrationRequestError"), error);
            toast.error(t("registrationError"));
        }
    };

    return (
        <PublicProvider>
            <AuthSectionWrapper title={t("registration")} subtitle={t("registrationSubTitle")}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-stagger space-y-5">
                        <RenderInputField form={form} name="name" label="name" />
                        <RenderEmailField form={form} name="email" />
                        <RenderInputField form={form} name="verificationCode" label="verificationCode" />
                        <RenderPassword form={form} name="password" label="password" />
                        <RenderPassword form={form} name="confirmPassword" label="confirmPassword" />

                        <Button disabled={isPending} type="submit" className={authPrimaryButtonClass}>
                            {t("registration")}
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

export default Registration;
