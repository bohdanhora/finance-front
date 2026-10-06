"use client";

import { useTranslations } from "next-intl";

import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";

import { useLoginToast } from "hooks/use-login-toast";
import { Navbar } from "components/navbar";
import { OnboardingTour } from "components/onboarding/tour";
import { Total } from "components/total";
import { PossibleRemaining } from "components/possible-remaining-balance";
import { NextMonthIncome } from "components/next-month-income";
import { LastSpends } from "components/last-spends";
import { TotalAmounts } from "components/total-amounts";
import { Section } from "components/wrappers/section";

const Home = () => {
    const t = useTranslations();
    const tTx = useTranslations("transactions");
    const tSections = useTranslations("sections");

    useLoginToast(t);

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />
                <OnboardingTour />

                <div className="sheet">
                    <div className="shell rise-stagger flex flex-col gap-16 pt-8 pb-28 sm:pb-20 md:gap-20 md:pt-10">
                        <Total />
                        <PossibleRemaining />
                        <NextMonthIncome />

                        <Section
                            index="03"
                            anchor="history"
                            title={tTx("history")}
                            description={tSections("historyNote")}
                        >
                            <LastSpends />
                        </Section>

                        <TotalAmounts />
                    </div>
                </div>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default Home;
