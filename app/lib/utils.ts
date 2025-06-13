import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MonobankCurrency } from '../types'
import { ISO4217Codes } from '../constants'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function createDateString(date: Date) {
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
}

export const findCurrency = (
    currency: MonobankCurrency[],
    isoCode: ISO4217Codes
) => {
    if (!currency.length) return null

    const USDtoUAH = currency?.find(
        (item) =>
            item.currencyCodeA === isoCode &&
            item.currencyCodeB === ISO4217Codes.UAH
    )

    return USDtoUAH
}
