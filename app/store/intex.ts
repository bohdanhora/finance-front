import { create } from 'zustand'
import { StoreType } from './type'

const useStore = create<StoreType>((set) => ({
    total: 20234,
    totalIncome: 0,
    totalSpend: 0,
    lastTransactions: [],
    categories: ['beauty', 'home', 'health', 'rest'],

    setTotal: (addMoney) =>
        set((state) => ({
            total: state.total + addMoney,
        })),
    setTotalIncome: (addMoney) =>
        set((state) => ({
            totalIncome: state.totalIncome + addMoney,
        })),

    setNewSpend: (spend) =>
        set((state) => ({
            lastTransactions: [spend, ...state.lastTransactions],
        })),
    calculateTotal: () =>
        set((state) => ({
            total: state.total - state.totalSpend,
        })),
    setTotalSpend: (spend) =>
        set((state) => ({
            totalSpend: state.totalSpend + spend,
        })),
}))
export default useStore
