import { MonobankCurrency } from "./auth";
import { EssentialType, TransactionType } from "types/transactions";

export type StoreType = {
    totalAmount: number;
    totalIncome: number;
    totalSpend: number;
    nextMonthTotalAmount: number;
    percentage: number;

    defaultEssentialsArray: EssentialType[] | [];
    essentialsArray: EssentialType[] | [];
    nextMonthEssentialsArray: EssentialType[] | [];
    transactions: TransactionType[] | [];

    setTotalAmount: (totalAmount: number) => void;
    setTotalIncome: (totalIncome: number) => void;
    setTotalSpend: (totalSpend: number) => void;
    setNextMonthTotalAmount: (nextMonthTotalAmount: number) => void;
    setPercentage: (percentage: number) => void;

    setDefaultEssentialsArray: (defaultEssentialsArray: EssentialType[] | []) => void;
    setEssentialsArray: (essentialsArray: EssentialType[] | []) => void;
    setNextMonthEssentialsArray: (nextMonthEssentialsArray: EssentialType[] | []) => void;
    setTransactions: (transactions: TransactionType[] | []) => void;
    setAllToDefaults: () => void;
};

export type BankStoreType = {
    usd: MonobankCurrency | null;
    eur: MonobankCurrency | null;
    currency: string;

    setUsd: (obj: MonobankCurrency | null) => void;
    setEur: (obj: MonobankCurrency | null) => void;
    setCurrency: (newCurrency: string) => void;
};
export type OtherStoreType = {
    email: string;

    setEmail: (email: string) => void;
};
