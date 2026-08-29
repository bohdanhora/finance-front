"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";

import { useRequestEmailCode } from "api/auth";
import { Routes } from "constants/routes";
import { RenderEmailField } from "components/form-fields/email";
import { BackToLogin } from "components/back-to-login";
import { authPrimaryButtonClass, authSecondaryButtonClass } from "components/form-fields/styles";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { useResendTimer } from "hooks/use-resend-timer";
import useOtherStore from "store/other";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { PublicProvider } from "providers/auth";
import { useSendEmailForm } from "./use-send-email-form";
import { sendEmailSchema } from "schemas/auth";

type SendEmailData = z.infer<ReturnType<typeof sendEmailSchema>>;

const SendEmailCodePage = () => {
    const otherStore = useOtherStore();
    const tAuth = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: requestEmailCode, isPending } = useRequestEmailCode();

    const { resendTimer, codeSent, startTimer } = useResendTimer();

    const form = useSendEmailForm(tAuth);

    const email = form.watch("email");

    const onSubmit = async (values: SendEmailData) => {
        try {
            const res = await requestEmailCode(values);
            toast.success(res.message);
            startTimer();
        } catch (error) {
            console.error(tAuth("sendEmailRequestError"), error);
            toast.error(tAuth("sendEmailError"));
        }
    };

    const proceedToRegistration = () => {
        otherStore.setEmail(email);
        router.push(Routes.REGISTRATION);
    };

    const handleResend = async () => {
        if (!email) return;
        await requestEmailCode({ email });
        startTimer();
    };

    return (
        <PublicProvider>
            <AuthSectionWrapper title={tAuth("emailVerificationTitle")} subtitle={tAuth("emailVerificationSubtitle")}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-stagger space-y-5">
                        <RenderEmailField form={form} name="email" />

                        {codeSent ? (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={handleResend}
                                disabled={resendTimer > 0}
                                className={authSecondaryButtonClass}
                            >
                                {resendTimer > 0 ? `${tAuth("resendCode")} (${resendTimer})` : tAuth("resendCode")}
                            </Button>
                        ) : (
                            <Button
                                disabled={isPending || !form.formState.isValid}
                                type="submit"
                                className={authPrimaryButtonClass}
                            >
                                {tAuth("sendCode")}
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            type="button"
                            onClick={proceedToRegistration}
                            className={authSecondaryButtonClass}
                        >
                            {tAuth("iReceivedCode")}
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

export default SendEmailCodePage;
