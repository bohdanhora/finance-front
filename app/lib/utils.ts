import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function createDateString(date: Date) {
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
}
