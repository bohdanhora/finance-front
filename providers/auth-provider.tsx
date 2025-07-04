'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Routes } from 'constants/routes'

export const PrivateProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('accessToken')

        if (!token) {
            router.push(Routes.LOGIN)
            setIsAuthenticated(false)
        } else {
            setIsAuthenticated(true)
        }
    }, [])

    if (isAuthenticated === null) {
        return null
    }

    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}

export const PublicProvider = ({ children }: { children: ReactNode }) => {
    const [checking, setChecking] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('accessToken')

        if (token) {
            router.replace('/')
        } else {
            setChecking(false)
        }
    }, [])

    if (checking) return null

    return <>{children}</>
}
