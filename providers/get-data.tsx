"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAllTransactionInfo } from "api/main";
import useStore from "store/general";
import { Loader } from "components/loader";
import { useRouter } from "next/navigation";
import { Routes } from "constants/routes";
import { clearCookies } from "lib/logout";
import { AxiosError } from "axios";

export const GetDataProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [dataHydrated, setDataHydrated] = useState(false);

    const { data: allTransactionsData, isPending, error } = useAllTransactionInfo();

    useEffect(() => {
        if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;

            if (status === 401) {
                clearCookies();
                router.replace(Routes.LOGIN);
            }
        }
    }, [error, router]);

    useEffect(() => {
        if (!allTransactionsData) return;

        useStore.setState({
            totalAmount: allTransactionsData.totalAmount || 0,
            totalIncome: allTransactionsData.totalIncome || 0,
            totalSpend: allTransactionsData.totalSpend || 0,
            nextMonthTotalAmount: allTransactionsData.nextMonthTotalAmount || 0,
            percentage: allTransactionsData.savePercent || 0,
            defaultEssentialsArray: allTransactionsData.defaultEssentialsArray || [],
            essentialsArray: allTransactionsData.essentialsArray || [],
            nextMonthEssentialsArray: allTransactionsData.nextMonthEssentialsArray || [],
            transactions: allTransactionsData.transactions || [],
            savingsGoals: allTransactionsData.savingsGoals || [],
            savingsOperations: allTransactionsData.savingsOperations || [],
            ...(allTransactionsData.currency ? { userCurrency: allTransactionsData.currency } : {}),
            currencyInitialized: Boolean(allTransactionsData.currency),
        });
        setDataHydrated(true);
    }, [allTransactionsData]);

    if (isPending || (allTransactionsData && !dataHydrated)) {
        return <Loader />;
    }

    return <>{children}</>;
};
