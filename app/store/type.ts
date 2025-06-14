import { MonobankCurrency } from '../types'

export type SpendType = {
    description: string
    value: string
    date: string
    categorie: string
    id: string
}

export type StoreType = {
    total: number
    totalIncome: number
    totalSpend: number
    nextMonthIncome: number
    lastTransactions: SpendType[] | []
    categories: string[] | []

    setTotalIncome: (spend: number) => void
    setTotal: (spend: number) => void
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
