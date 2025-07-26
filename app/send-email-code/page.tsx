"use client";

import { z } from "zod";

import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useTranslations } from "next-intl";
import { Routes } from "constants/routes";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { useRouter } from "next/navigation";
import { useRequestEmailCode } from "api/auth";
import { toast } from "react-toastify";
import useOtherStore from "store/other";
import { RenderEmailField } from "components/form-fields/email";
import { BackToLogin } from "components/back-to-login";
import { useSendEmailForm } from "./use-send-email-form";
import { sendEmailSchema } from "schemas/auth";
import { useResendTimer } from "hooks/use-resend-timer";

export const SendEmailCodePage = () => {
    const otherStore = useOtherStore();
    const tAuth = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: requestEmailCode, isPending: requestEmailPending } = useRequestEmailCode();

    const { resendTimer, codeSent, startTimer } = useResendTimer();

    const form = useSendEmailForm(tAuth);
    type SendEmailData = z.infer<ReturnType<typeof sendEmailSchema>>;

    const email = form.watch("email");

    const onSubmit = async (values: SendEmailData) => {
        const res = await requestEmailCode(values);
        toast.success(res.message);
        startTimer();
    };

    const proceedToRegistration = () => {
        otherStore.setEmail(email);
        router.push(Routes.REGISTRATION);
    };

    const handleResend = async () => {
        if (email) {
            await requestEmailCode({ email });
            startTimer();
        }
    };

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper
                    title={tAuth("emailVerificationTitle")}
                    subtitle={tAuth("emailVerificationSubtitle")}
                >
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <RenderEmailField form={form} name="email" />

                            {codeSent ? (
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendTimer > 0}
                                    className="w-full mb-5 py-4"
                                >
                                    {resendTimer > 0 ? `${tAuth("resendCode")} (${resendTimer})` : tAuth("resendCode")}
                                </Button>
                            ) : (
                                <Button disabled={requestEmailPending} type="submit" className="w-full mb-5 py-4">
                                    {tAuth("sendCode")}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                type="button"
                                onClick={proceedToRegistration}
                                className="w-full mb-5 py-4"
                            >
                                {tAuth("iReceivedCode")}
                            </Button>
                            <BackToLogin />
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
};
