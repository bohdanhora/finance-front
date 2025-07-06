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
    userId: string
}

export type LoginErrorResponse = {
    error: string
    message: string
    statusCode: number
}

export type RegistrationPayload = {
    name: string
    email: string
    password: string
}

export type RegistrationResponseType = {
    accessToken: string
    refreshToken: string
}

export type RegistrationErrorResponse = {
    error: string
    message: string
    statusCode: number
}

export type LogoutPayload = {
    userId: string
}

export type LogoutResponseType = {
    message: string
}

export type LogoutErrorResponse = {
    error: string
    message: string
    statusCode: number
}
