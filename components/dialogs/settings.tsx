"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { MonobankConnection } from "components/settings/monobank-connection";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "components/ui/dialog";
import { SETTINGS_OPEN_EVENT } from "lib/monobank";

export const SettingsDialog = () => {
    const t = useTranslations("monobank");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const openSettings = () => setOpen(true);
        window.addEventListener(SETTINGS_OPEN_EVENT, openSettings);

        return () => window.removeEventListener(SETTINGS_OPEN_EVENT, openSettings);
    }, []);

    const close = () => setOpen(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[540px]">
                <DialogHeader>
                    <DialogTitle>{t("settingsTitle")}</DialogTitle>
                    <DialogDescription>{t("settingsDescription")}</DialogDescription>
                </DialogHeader>

                <div className="flex min-w-0 flex-col gap-3">
                    <MonobankConnection opened={open} onNavigate={close} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
