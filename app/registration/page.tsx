"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";
import { isAxiosError } from "axios";
import { CircleAlert, ShieldAlert } from "lucide-react";

import { useClaimEmailMutation, useRegistrationMutation, useRequestEmailCode } from "api/auth";
import { Routes } from "constants/routes";
import { RenderEmailField } from "components/form-fields/email";
import { RenderInputField } from "components/form-fields/input";
import { RenderPassword } from "components/form-fields/password";
import { BackToLogin } from "components/back-to-login";
import { authInputClass, authPrimaryButtonClass, authSecondaryButtonClass } from "components/form-fields/styles";
import { AuthSectionWrapper } from "components/wrappers/auth-section";
import { useResendTimer } from "hooks/use-resend-timer";
import { authErrorCode } from "lib/auth-helper";
import { showAxiosError } from "lib/utils";
import useOtherStore from "store/other";
import { Button } from "ui/button";
import { Form } from "ui/form";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { PublicProvider } from "providers/auth";
import { useRegistrationForm } from "./use-registration-form";
import { registrationSchema } from "schemas/auth";

type RegistrationFormData = z.infer<ReturnType<typeof registrationSchema>>;
type Conflict = { kind: "taken" | "unverified"; email: string } | null;

const Registration = () => {
    const otherStore = useOtherStore();
    const t = useTranslations("auth");
    const router = useRouter();

    const registration = useRegistrationMutation();
    const claim = useClaimEmailMutation();
    const requestCode = useRequestEmailCode();
    const { resendTimer, codeSent, startTimer } = useResendTimer();

    const form = useRegistrationForm(t, otherStore.email);
    const email = form.watch("email");

    const [conflict, setConflict] = useState<Conflict>(null);
    const [code, setCode] = useState("");

    useEffect(() => {
        if (conflict && email.trim().toLowerCase() !== conflict.email) {
            setConflict(null);
            setCode("");
        }
    }, [conflict, email]);

    const goHome = () => router.replace(Routes.HOME);

    const onSubmit = async (data: RegistrationFormData) => {
        try {
            await registration.mutateAsync({
                name: data.name.trim(),
                email: data.email.trim(),
                password: data.password,
            });
            goHome();
        } catch (error) {
            const errorCode = authErrorCode(error);
            if (errorCode === "EMAIL_TAKEN" || errorCode === "EMAIL_UNVERIFIED") {
                setConflict({
                    kind: errorCode === "EMAIL_TAKEN" ? "taken" : "unverified",
                    email: data.email.trim().toLowerCase(),
                });
                return;
            }
            if (isAxiosError(error)) {
                showAxiosError(error);
                return;
            }
            toast.error(t("registrationError"));
        }
    };

    const sendClaimCode = async () => {
        if (!conflict) return;
        try {
            await requestCode.mutateAsync({ email: conflict.email });
            toast.success(t("codeSentTo", { email: conflict.email }));
            startTimer();
        } catch (error) {
            toast.error(authErrorCode(error) === "CODE_RECENTLY_SENT" ? t("codeWait") : t("sendEmailError"));
        }
    };

    const confirmClaim = async () => {
        const values = form.getValues();
        const valid = await form.trigger();
        if (!valid || !conflict) return;
        try {
            await claim.mutateAsync({
                name: values.name.trim(),
                email: conflict.email,
                password: values.password,
                verificationCode: code.trim(),
            });
            goHome();
        } catch (error) {
            const errorCode = authErrorCode(error);
            if (errorCode === "EMAIL_TAKEN") {
                setConflict({ kind: "taken", email: conflict.email });
                return;
            }
            toast.error(t("invalidCode"));
        }
    };

    const openWithEmail = (route: Routes) => {
        otherStore.setEmail(conflict?.email ?? email);
        router.push(route);
    };

    return (
        <PublicProvider>
            <AuthSectionWrapper title={t("registration")}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-stagger space-y-5">
                        <RenderInputField form={form} name="name" label="name" />
                        <RenderEmailField form={form} name="email" />

                        {conflict?.kind === "taken" && (
                            <div className="border-warn space-y-3 border-l-2 py-1 pl-4">
                                <p className="flex items-start gap-2 text-sm font-medium">
                                    <CircleAlert className="text-warn mt-0.5 size-4 shrink-0" />
                                    {t("emailTakenTitle")}
                                </p>
                                <p className="text-ink-muted text-sm">{t("emailTakenText")}</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <Button type="button" onClick={() => openWithEmail(Routes.LOGIN)}>
                                        {t("signInInstead")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => openWithEmail(Routes.FORGOT_PASSWORD)}
                                    >
                                        {t("restorePassword")}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {conflict?.kind === "unverified" && (
                            <div className="border-warn space-y-3 border-l-2 py-1 pl-4">
                                <p className="flex items-start gap-2 text-sm font-medium">
                                    <ShieldAlert className="text-warn mt-0.5 size-4 shrink-0" />
                                    {t("emailUnverifiedTitle")}
                                </p>
                                <p className="text-ink-muted text-sm">{t("emailUnverifiedText")}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={authSecondaryButtonClass}
                                    disabled={requestCode.isPending || resendTimer > 0}
                                    onClick={sendClaimCode}
                                >
                                    {codeSent
                                        ? resendTimer > 0
                                            ? `${t("resendCode")} (${resendTimer})`
                                            : t("resendCode")
                                        : t("claimSendCode")}
                                </Button>
                                {codeSent && (
                                    <div className="space-y-2">
                                        <Label htmlFor="claim-code">{t("verificationCode")}</Label>
                                        <Input
                                            id="claim-code"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            placeholder="123456"
                                            className={authInputClass}
                                            value={code}
                                            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                                        />
                                        <p className="text-signal text-xs">{t("claimWarning")}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <RenderPassword form={form} name="password" label="password" />

                        {conflict?.kind === "unverified" && codeSent ? (
                            <Button
                                type="button"
                                disabled={claim.isPending || code.trim().length !== 6}
                                onClick={confirmClaim}
                                className={authPrimaryButtonClass}
                            >
                                {t("claimConfirm")}
                            </Button>
                        ) : (
                            conflict === null && (
                                <Button
                                    disabled={registration.isPending}
                                    type="submit"
                                    className={authPrimaryButtonClass}
                                >
                                    {t("registration")}
                                </Button>
                            )
                        )}
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
