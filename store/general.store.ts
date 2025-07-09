import { create } from 'zustand'
import { StoreType } from './type'

const useStore = create<StoreType>((set) => ({
    totalAmount: 0,
    totalIncome: 0,
    totalSpend: 0,
    nextMonthTotalAmount: 0,

    defaultEssentialsArray: [],
    essentialsArray: [],
    nextMonthEssentialsArray: [],
    transactions: [],

    setTotalAmount: (totalAmount) =>
        set(() => ({
            totalAmount: totalAmount,
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

    // setNewEssential: (essential) =>
    //     set((state) => ({
    //         essentials: [essential, ...state.essentials],
    //     })),
    // setEssentialChecked: (essential) =>
    //     set((state) => ({
    //         essentials: state.essentials.map((item) =>
    //             item.id === essential.id
    //                 ? { ...item, checked: essential.checked }
    //                 : { ...item }
    //         ),
    //     })),
    // removeEssential: (id) =>
    //     set((state) => ({
    //         essentials: state.essentials.filter((i) => i.id !== id),
    //     })),
    // setNextMonthNewEssential: (essential) =>
    //     set((state) => ({
    //         nextMonthEssentials: [essential, ...state.nextMonthEssentials],
    //     })),
    // setNextMonthEssentialChecked: (essential) =>
    //     set((state) => ({
    //         nextMonthEssentials: state.nextMonthEssentials.map((item) =>
    //             item.id === essential.id
    //                 ? { ...item, checked: essential.checked }
    //                 : { ...item }
    //         ),
    //     })),
    // removeNextMonthEssential: (id) =>
    //     set((state) => ({
    //         nextMonthEssentials: state.nextMonthEssentials.filter(
    //             (i) => i.id !== id
    //         ),
    //     })),
}))
export default useStore
