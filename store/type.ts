import { MonobankCurrency } from '../types'

export type SpendType = {
    description: string
    value: string
    date: string
    categorie: string
    id: string
}

export type EssentialType = {
    id: string
    amount: number
    title: string
    checked: boolean
}

export type StoreType = {
    total: number
    totalIncome: number
    totalSpend: number
    nextMonthIncome: number
    essentials: EssentialType[] | []
    nextMonthEssentials: EssentialType[] | []
    lastTransactions: SpendType[] | []

    setTotalIncome: (spend: number) => void
    setTotal: (spend: number) => void
    setFullEssentials: (essentialAray: EssentialType[]) => void
    setNewEssential: (essential: EssentialType) => void
    setEssentialChecked: (
        essential: Pick<EssentialType, 'id' | 'checked'>
    ) => void
    removeEssential: (id: string) => void
    setNextMonthFullEssentials: (essentialAray: EssentialType[]) => void
    setNextMonthNewEssential: (essential: EssentialType) => void
    setNextMonthEssentialChecked: (
        essential: Pick<EssentialType, 'id' | 'checked'>
    ) => void
    removeNextMonthEssential: (id: string) => void
    setNewSpend: (spend: SpendType) => void
    setTotalSpend: (spend: number) => void
    calculateTotalAfterExpence: (expence: number) => void
    setNextMonthIncome: (income: number) => void
}

export type BankStoreType = {
    usd: MonobankCurrency | null
    eur: MonobankCurrency | null
    currency: string

    setUsd: (obj: MonobankCurrency | null) => void
    setEur: (obj: MonobankCurrency | null) => void
    setCurrency: (newCurrency: string) => void
}
