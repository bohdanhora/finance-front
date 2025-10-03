"use client";

import { useTranslations } from "next-intl";

import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";

import { useLoginToast } from "hooks/use-login-toast";
import { Navbar } from "components/navbar";
import { Total } from "components/total";
import { PossibleRemaining } from "components/possible-remaining-balance";
import { NextMonthIncome } from "components/next-month-income";
import { LastSpends } from "components/last-spends";
import { TotalAmounts } from "components/total-amounts";
import { CategoryChart } from "components/chart";
import useStore from "store/general";
import { FillForm } from "components/fill-form";
import { ChoooseCurrency } from "components/dialogs/choose-currency";

const Home = () => {
    const t = useTranslations();
    const store = useStore();

    useLoginToast(t);

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />
                <div className="relative w-full flex justify-center my-10">
                    <div className="max-w-7xl w-full flex flex-col gap-10 items-center px-3">
                        <Total />
                        <PossibleRemaining />
                        <NextMonthIncome />
                        <LastSpends />
                        <TotalAmounts />
                        <CategoryChart transactions={store.transactions} />
                    </div>
                    <FillForm />
                    <ChoooseCurrency />
                </div>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default Home;
