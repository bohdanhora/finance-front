"use client";

import { useTranslations } from "next-intl";

import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";
import { Navbar } from "components/navbar";
import { LastSpends } from "components/last-spends";
import { PageHeader, PageShell } from "components/wrappers/page-header";

const OperationsPage = () => {
    const t = useTranslations("transactions");
    const tSections = useTranslations("sections");

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />
                <PageShell>
                    <PageHeader title={t("history")} subtitle={tSections("historyNote")} />
                    <LastSpends />
                </PageShell>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default OperationsPage;
