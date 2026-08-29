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
import { FillForm } from "components/fill-form";
import { ChoooseCurrency } from "components/dialogs/choose-currency";
import { Section } from "components/wrappers/section";

const Home = () => {
    const t = useTranslations();
    const tTx = useTranslations("transactions");

    useLoginToast(t);

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />
                <OnboardingTour />

                <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:px-6">
                    <div className="rise-stagger flex w-full flex-col gap-10">
                        <Total />
                        <PossibleRemaining />
                        <NextMonthIncome />

                        <Section title={tTx("history")}>
                            <LastSpends />
                        </Section>

                        <TotalAmounts />
                    </div>
                </div>

                <FillForm />
                <ChoooseCurrency />
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default Home;
