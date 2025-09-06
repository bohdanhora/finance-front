import { create } from "zustand";
import { StoreType } from "types/stores";

const useStore = create<StoreType>((set) => ({
    totalAmount: 0,
    totalIncome: 0,
    totalSpend: 0,
    nextMonthTotalAmount: 0,
    percentage: 25,

    defaultEssentialsArray: [],
    essentialsArray: [],
    nextMonthEssentialsArray: [],
    transactions: [],

    setTotalAmount: (totalAmount) =>
        set(() => ({
            totalAmount: totalAmount,
        })),
    setPercentage: (percentage) =>
        set(() => ({
            percentage: percentage,
        })),
    setTotalIncome: (totalIncome) =>
        set(() => ({
            totalIncome: totalIncome,
        })),
    setTotalSpend: (totalSpend) =>
        set(() => ({
            totalSpend: totalSpend,
        })),
    setNextMonthTotalAmount: (nextMonthTotalAmount) =>
        set(() => ({
            nextMonthTotalAmount: nextMonthTotalAmount,
        })),

    setDefaultEssentialsArray: (defaultEssentialsArray) =>
        set(() => ({
            defaultEssentialsArray: defaultEssentialsArray,
        })),
    setEssentialsArray: (essentialsArray) =>
        set(() => ({
            essentialsArray: essentialsArray,
        })),
    setNextMonthEssentialsArray: (nextMonthEssentialsArray) =>
        set(() => ({
            nextMonthEssentialsArray: nextMonthEssentialsArray,
        })),
    setTransactions: (transactions) =>
        set(() => ({
            transactions: transactions,
        })),
    setAllToDefaults: () =>
        set(() => ({
            totalAmount: 0,
            totalIncome: 0,
            totalSpend: 0,
            nextMonthTotalAmount: 0,
            percentage: 10,

            defaultEssentialsArray: [],
            essentialsArray: [],
            nextMonthEssentialsArray: [],
            transactions: [],
        })),
}));
export default useStore;
