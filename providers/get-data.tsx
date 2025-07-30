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
    const store = useStore();
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

        store.setTotalAmount(allTransactionsData.totalAmount || 0);
        store.setTotalIncome(allTransactionsData.totalIncome || 0);
        store.setTotalSpend(allTransactionsData.totalSpend || 0);
        store.setNextMonthTotalAmount(allTransactionsData.nextMonthTotalAmount || 0);
        store.setDefaultEssentialsArray(allTransactionsData.defaultEssentialsArray || []);
        store.setEssentialsArray(allTransactionsData.essentialsArray || []);
        store.setNextMonthEssentialsArray(allTransactionsData.nextMonthEssentialsArray || []);
        store.setTransactions(allTransactionsData.transactions || []);
    }, [allTransactionsData]);

    if (isPending) {
        return <Loader />;
    }

    return <>{children}</>;
};
