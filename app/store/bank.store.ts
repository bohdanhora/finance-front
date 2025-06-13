import { create } from 'zustand'
import { BankStoreType } from './type'
import { CURRENCY } from '../constants'

const useBankStore = create<BankStoreType>((set) => ({
    usd: null,
    eur: null,
    currency: CURRENCY.USD,

    setUsd: (obj) =>
        set(() => ({
            usd: obj,
        })),
    setEur: (obj) =>
        set(() => ({
            eur: obj,
        })),
    setCurrency: (newCurrency) =>
        set(() => ({
            currency: newCurrency,
        })),
}))
export default useBankStore
