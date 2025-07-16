import { MonobankCurrency } from "./auth.types";
import { EssentialType, TransactionType } from "types/transactions.types";

export type StoreType = {
    totalAmount: number;
    totalIncome: number;
    totalSpend: number;
    nextMonthTotalAmount: number;

    defaultEssentialsArray: EssentialType[] | [];
    essentialsArray: EssentialType[] | [];
    nextMonthEssentialsArray: EssentialType[] | [];
    transactions: TransactionType[] | [];

    setTotalAmount: (totalAmount: number) => void;
    setTotalIncome: (totalIncome: number) => void;
    setTotalSpend: (totalSpend: number) => void;
    setNextMonthTotalAmount: (nextMonthTotalAmount: number) => void;

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
