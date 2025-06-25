'use client'

import { ReactNode } from 'react'

export const PrivateProvider = ({ children }: { children: ReactNode }) => {
    const token = localStorage.getItem('token')

    if (!token) {
        return null
    }

    return <>{children}</>
}
