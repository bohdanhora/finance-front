import { create } from 'zustand'
import { StoreType } from './type'

const useStore = create<StoreType>((set) => ({
    total: 0,
    totalIncome: 0,
    totalSpend: 0,
    lastTransactions: [],
    essentials: [],
    nextMonthEssentials: [],
    nextMonthIncome: 0,

    setTotal: (addMoney) =>
        set((state) => ({
            total: state.total + addMoney,
        })),
    setTotalIncome: (addMoney) =>
        set((state) => ({
            totalIncome: state.totalIncome + addMoney,
        })),
    setNextMonthIncome: (income) =>
        set(() => ({
            nextMonthIncome: income,
        })),

    setFullEssentials: (essentialArray) =>
        set(() => ({
            essentials: essentialArray,
        })),
    setNewEssential: (essential) =>
        set((state) => ({
            essentials: [essential, ...state.essentials],
        })),
    setEssentialChecked: (essential) =>
        set((state) => ({
            essentials: state.essentials.map((item) =>
                item.id === essential.id
                    ? { ...item, checked: essential.checked }
                    : { ...item }
            ),
        })),
    setNextMonthFullEssentials: (essentialArray) =>
        set(() => ({
            nextMonthEssentials: essentialArray,
        })),
    setNextMonthNewEssential: (essential) =>
        set((state) => ({
            nextMonthEssentials: [essential, ...state.nextMonthEssentials],
        })),
    setNextMonthEssentialChecked: (essential) =>
        set((state) => ({
            nextMonthEssentials: state.nextMonthEssentials.map((item) =>
                item.id === essential.id
                    ? { ...item, checked: essential.checked }
                    : { ...item }
            ),
        })),
    setNewSpend: (spend) =>
        set((state) => ({
            lastTransactions: [spend, ...state.lastTransactions],
        })),
    calculateTotalAfterExpence: (expence) =>
        set((state) => ({
            total: state.total - expence,
        })),
    setTotalSpend: (spend) =>
        set((state) => ({
            totalSpend: state.totalSpend + spend,
        })),
}))
export default useStore
