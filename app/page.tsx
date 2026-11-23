"use client";

import { useTranslations } from "next-intl";

import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";

import { useLoginToast } from "hooks/use-login-toast";
import { Navbar } from "components/navbar";
import { OnboardingTour } from "components/onboarding/tour";
import { Total } from "components/total";
import { PossibleRemaining } from "components/possible-remaining-balance";
import { RecentOperations } from "components/recent-operations";
import { NextMonthIncome } from "components/next-month-income";
import { EmailVerifyBanner } from "components/email-verify-banner";

const Home = () => {
    const t = useTranslations();

    useLoginToast(t);

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />
                <OnboardingTour />

                <div className="sheet">
                    <div className="shell rise-stagger flex flex-col gap-16 pt-8 pb-28 sm:pb-20 md:gap-20 md:pt-10">
                        <div className="flex flex-col gap-8">
                            <EmailVerifyBanner />
                            <Total />
                        </div>
                        <PossibleRemaining recent={<RecentOperations />} />
                        <NextMonthIncome />
                    </div>
                </div>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default Home;
