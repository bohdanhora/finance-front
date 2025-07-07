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

export type AllTransactionsInfoResponse = {
    userId: string
    totalAmount: number
    nextMonthTotalAmount: number
    defaultEssentialsArray: string[] | []
    essentialsArray: string[] | []
    nextMonthEssentialsArray: string[] | []
    transactions: string[] | []
}
