export type MonobankCurrency = {
    currencyCodeA: number
    currencyCodeB: number
    date: number
    rateBuy: number
    rateSell: number
}

export type LoginPayload = {
    email: string
    password: string
}

export type LoginResponseType = {
    accessToken: string
    refreshToken: string
}

export type LoginErrorResponse = {
    error: string
    message: string
    statusCode: number
}
