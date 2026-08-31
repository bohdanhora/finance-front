"use client";

import { ReactNode, useEffect } from "react";
import { useAllTransactionInfo } from "api/main";
import useStore from "store/general";
import { Loader } from "components/loader";
import { useRouter } from "next/navigation";
import { Routes } from "constants/routes";
import { clearCookies } from "lib/logout";
import { AxiosError } from "axios";

export const GetDataProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();

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
        });
    }, [allTransactionsData]);

    if (isPending) {
        return <Loader />;
    }

    return <>{children}</>;
};
