"use client";

import { ChartPieByCategory } from "components/chart-by-categories.component";
import LastSpends from "components/last-spends.component";
import Navbar from "components/navbar.component";
import NextMonthIncome from "components/next-month-income.component";
import PossibleRemaining from "components/possible-remaining-balance.component";
import Total from "components/total";
import TotalAmounts from "components/total-amounts.component";
import { useTranslations } from "next-intl";
import { PrivateProvider } from "providers/auth-provider";
import { GetDataProvider } from "providers/get-data.provider";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function Home() {
    const t = useTranslations();

    useEffect(() => {
        const shouldShowToast = sessionStorage.getItem("showLoginToast");
        if (shouldShowToast) {
            toast.success(t("api.successLogin"));
            sessionStorage.removeItem("showLoginToast");
        }
    }, []);

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
