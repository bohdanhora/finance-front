"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { PrivateProvider } from "providers/auth-provider";
import { GetDataProvider } from "providers/get-data.provider";

import Navbar from "components/navbar.component";
import Total from "components/total";
import PossibleRemaining from "components/possible-remaining-balance.component";
import NextMonthIncome from "components/next-month-income.component";
import LastSpends from "components/last-spends.component";
import TotalAmounts from "components/total-amounts.component";
import { ChartPieByCategory } from "components/chart-by-categories.component";
import { useLoginToast } from "hooks/use-login-toast";

export default function Home() {
    const t = useTranslations();

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
                        <ChartPieByCategory />
                    </div>
                </div>
            </PrivateProvider>
        </GetDataProvider>
    );
}
