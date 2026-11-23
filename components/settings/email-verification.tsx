"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "react-toastify";

import { useAccount, useRequestOwnVerification, useVerifyOwnEmail } from "api/account";
import { ConnectionCard, KeyField } from "components/settings/connection-card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { useResendTimer } from "hooks/use-resend-timer";
import { authErrorCode } from "lib/auth-helper";

export const EmailVerificationForm = ({ email, onDone }: { email: string; onDone?: () => void }) => {
    const t = useTranslations("emailVerify");
    const tAuth = useTranslations("auth");
    const requestCode = useRequestOwnVerification();
    const verify = useVerifyOwnEmail();
    const { resendTimer, codeSent, startTimer } = useResendTimer();
    const [code, setCode] = useState("");

    const send = async () => {
        try {
            const result = await requestCode.mutateAsync();
            if (result.emailVerified) {
                toast.success(t("success"));
                onDone?.();
                return;
            }
            toast.success(t("codeSent", { email }));
            startTimer();
        } catch (error) {
            if (authErrorCode(error) === "CODE_RECENTLY_SENT") {
                toast.info(tAuth("codeWait"));
                startTimer();
                return;
            }
            toast.error(tAuth("sendEmailError"));
        }
    };

    const confirm = async () => {
        try {
            await verify.mutateAsync(code.trim());
            toast.success(t("success"));
            setCode("");
            onDone?.();
        } catch {
            toast.error(tAuth("invalidCode"));
        }
    };

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
                event.preventDefault();
                if (code.trim().length === 6) void confirm();
            }}
        >
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-verification-code">{t("codeLabel")}</Label>
                <KeyField>
                    <Input
                        id="email-verification-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="123456"
                        value={code}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                        className="font-mono tracking-widest sm:flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 sm:h-10"
                        disabled={requestCode.isPending || resendTimer > 0}
                        onClick={send}
                    >
                        {requestCode.isPending && <Loader2 className="animate-spin" />}
                        {codeSent ? (resendTimer > 0 ? `${t("resend")} (${resendTimer})` : t("resend")) : t("sendCode")}
                    </Button>
                </KeyField>
                {codeSent && <p className="text-ink-faint text-xs">{t("codeSent", { email })}</p>}
            </div>
            <Button type="submit" disabled={verify.isPending || code.trim().length !== 6}>
                {verify.isPending && <Loader2 className="animate-spin" />}
                {t("submit")}
            </Button>
        </form>
    );
};

export const EmailVerificationCard = () => {
    const t = useTranslations("emailVerify");
    const { data: account } = useAccount();

    if (!account) return null;
    const verified = account.emailVerified !== false;

    return (
        <ConnectionCard
            mark={
                <span className="bg-wash flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <MailCheck className="size-4" />
                </span>
            }
            title={t("title")}
            status={
                verified ? t("statusVerified", { email: account.email }) : t("statusPending", { email: account.email })
            }
            connected={verified}
            connectedLabel={t("verifiedBadge")}
            note={t("note")}
        >
            {verified ? (
                <p className="text-ink-muted text-sm">{t("verifiedText")}</p>
            ) : (
                <EmailVerificationForm email={account.email} />
            )}
        </ConnectionCard>
    );
};
