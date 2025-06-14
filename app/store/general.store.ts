import { create } from 'zustand'
import { StoreType } from './type'

const useStore = create<StoreType>((set) => ({
    total: 0,
    totalIncome: 0,
    totalSpend: 0,
    lastTransactions: [],
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
