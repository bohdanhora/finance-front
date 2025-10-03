import { create } from "zustand";
import { StoreType } from "types/stores";
import { CURRENCY } from "constants/index";

const useStore = create<StoreType>((set) => ({
    totalAmount: 0,
    totalIncome: 0,
    totalSpend: 0,
    nextMonthTotalAmount: 0,
    percentage: 0,
    userCurrency: CURRENCY.UAH,

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
    setUserCurrency: (userCurrency) =>
        set(() => ({
            userCurrency: userCurrency,
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
            percentage: 0,

            defaultEssentialsArray: [],
            essentialsArray: [],
            nextMonthEssentialsArray: [],
            transactions: [],
        })),
}));
export default useStore;
