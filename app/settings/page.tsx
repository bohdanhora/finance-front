"use client";

import { useTranslations } from "next-intl";

import { Navbar } from "components/navbar";
import { AssistantConnection } from "components/settings/assistant-connection";
import { MonobankConnection } from "components/settings/monobank-connection";
import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";

const SettingsPage = () => {
    const t = useTranslations("monobank");

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />

                <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6">
                    <div className="rise-stagger flex w-full flex-col gap-8">
                        <header>
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("settingsTitle")}</h1>
                            <p className="text-muted-foreground mt-1 text-sm">{t("settingsDescription")}</p>
                        </header>

                        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
                            <AssistantConnection />
                            <MonobankConnection />
                        </div>
                    </div>
                </div>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default SettingsPage;
