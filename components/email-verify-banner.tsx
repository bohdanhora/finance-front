"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MailWarning } from "lucide-react";

import { useAccount } from "api/account";
import { EmailVerificationForm } from "components/settings/email-verification";
import { Button } from "components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "components/ui/dialog";

const SNOOZE_KEY = "finance:verify-email-snoozed";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

const readSnoozed = () => {
    try {
        return Number(window.localStorage.getItem(SNOOZE_KEY)) > Date.now();
    } catch {
        return false;
    }
};

export const EmailVerifyBanner = () => {
    const t = useTranslations("emailVerify");
    const { data: account } = useAccount();
    const [snoozed, setSnoozed] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => setSnoozed(readSnoozed()), []);

    if (!account || account.emailVerified !== false || snoozed) return null;

    const snooze = () => {
        try {
            window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
        } catch {}
        setSnoozed(true);
    };

    return (
        <>
            <div className="rounded-panel border-rule bg-surface flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:gap-4">
                <span className="bg-warn-wash text-warn flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <MailWarning className="size-4" />
                </span>
                <p className="text-ink-muted min-w-0 flex-1 text-sm">{t("bannerText", { email: account.email })}</p>
                <div className="flex shrink-0 gap-2">
                    <Button variant="ghost" size="sm" onClick={snooze}>
                        {t("later")}
                    </Button>
                    <Button size="sm" onClick={() => setOpen(true)}>
                        {t("confirm")}
                    </Button>
                </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("dialogTitle")}</DialogTitle>
                        <DialogDescription>{t("dialogText", { email: account.email })}</DialogDescription>
                    </DialogHeader>
                    <EmailVerificationForm email={account.email} onDone={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
};
