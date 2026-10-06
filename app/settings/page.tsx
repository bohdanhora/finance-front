"use client";

import { useTranslations } from "next-intl";

import { Navbar } from "components/navbar";
import { AccountPassword } from "components/settings/account-password";
import { AccountSessions } from "components/settings/account-sessions";
import { AssistantConnection } from "components/settings/assistant-connection";
import { MonobankConnection } from "components/settings/monobank-connection";
import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";
import { PageHeader, PageShell } from "components/wrappers/page-header";

const SettingsPage = () => {
    const t = useTranslations("monobank");

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />

                <PageShell>
                    <PageHeader index="05" title={t("settingsTitle")} subtitle={t("settingsDescription")} />

                    <div className="grid min-w-0 grid-cols-1 items-start gap-x-10 gap-y-14 lg:grid-cols-2">
                        <AssistantConnection />
                        <div className="flex min-w-0 flex-col gap-14">
                            <MonobankConnection />
                            <AccountPassword />
                        </div>
                    </div>

                    <AccountSessions />
                </PageShell>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default SettingsPage;
