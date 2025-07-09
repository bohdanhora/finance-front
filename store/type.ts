import { TransactionEnum } from 'constants/index'
import { MonobankCurrency } from '../types/auth.types'

export type TransactionType = {
    transactionType: TransactionEnum
    description: string
    value: number
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
    totalAmount: number
    totalIncome: number
    totalSpend: number
    nextMonthTotalAmount: number

    defaultEssentialsArray: EssentialType[] | []
    essentialsArray: EssentialType[] | []
    nextMonthEssentialsArray: EssentialType[] | []
    transactions: TransactionType[] | []

    setTotalAmount: (totalAmount: number) => void
    setTotalIncome: (totalIncome: number) => void
    setTotalSpend: (totalSpend: number) => void
    setNextMonthTotalAmount: (nextMonthTotalAmount: number) => void

    setDefaultEssentialsArray: (
        defaultEssentialsArray: EssentialType[] | []
    ) => void
    setEssentialsArray: (essentialsArray: EssentialType[] | []) => void
    setNextMonthEssentialsArray: (
        nextMonthEssentialsArray: EssentialType[] | []
    ) => void
    setTransactions: (transactions: TransactionType[] | []) => void
}

export type BankStoreType = {
    usd: MonobankCurrency | null
    eur: MonobankCurrency | null
    currency: string

    setUsd: (obj: MonobankCurrency | null) => void
    setEur: (obj: MonobankCurrency | null) => void
    setCurrency: (newCurrency: string) => void
}
