import { EssentialsType, TransactionType } from 'constants/index'
import { EssentialType } from 'store/type'

export type TotalAmountPayload = {
    totalAmount: number
}

export type TotalAmountResponseType = {
    message: string
    totalAmount: number
}

export type TotalAmountErrorResponse = {
    error: string
    message: string
    statusCode: number
}

export type NextMonthTotalAmountPayload = {
    nextMonthTotalAmount: number
}

export type NextMonthTotalAmountResponseType = {
    message: string
    nextMonthTotalAmount: number
}

export type NextMonthTotalAmountErrorResponse = {
    error: string
    message: string
    statusCode: number
}

export type EssentialPaymentsPayload = {
    type: EssentialsType
    items: EssentialType[]
}

export type EssentialPaymentsResponseType = {
    message: string
    nextMonthTotalAmount: number
}

export type EssentialPaymentsErrorResponse = {
    error: string
    message: string
    statusCode: number
}

export type NewTransactionPaymentsPayload = {
    transactionType: TransactionType
    id: string
    value: number
    date: Date
    categorie: string
    description: string
}

export type NewTransactionResponseType = {
    message: string
    updatedTotals: {
        totalAmount: number
        totalIncome: number
        totalSpend: number
    }
}

export type NewTransactionErrorResponse = {
    error: string
    message: string
    statusCode: number
}

export type AllTransactionsInfoResponse = {
    userId: string
    totalAmount: number
    nextMonthTotalAmount: number
    defaultEssentialsArray: string[] | []
    essentialsArray: EssentialType[] | []
    nextMonthEssentialsArray: EssentialType[] | []
    transactions: string[] | []
}
