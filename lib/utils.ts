import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MonobankCurrency } from 'types/auth.types'
import { ISO4217Codes } from 'constants/index'

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

export const formatCurrency = (num: number) => {
    const absNum = Math.abs(num)

    const [intPart, decPart = ''] = absNum.toString().split('.')

    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    const formattedDec = (decPart + '00').slice(0, 2)

    if (num < 0) return '0'

    return `${formattedInt}.${formattedDec}`
}

export const calculateDailyBudget = (totalAmount: number) => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const daysLeft = lastDayOfMonth.getDate() - today.getDate() + 1

    if (daysLeft <= 0) {
        throw new Error('error month')
    }

    const dailyBudget = totalAmount / daysLeft

    const result = {
        daysLeft,
        dailyBudget,
    }
    return result
}

export const calculateSavings = (totalAmount: number) => {
    const percentageToSave = 0.1
    const saved = Number((totalAmount * percentageToSave).toFixed(2))
    const remaining = Number((totalAmount - saved).toFixed(2))

    return {
        saved,
        remaining,
    }
}
