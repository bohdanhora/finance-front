'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const PrivateProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (!token) {
            router.push('/login')
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
        const token = localStorage.getItem('token')

        if (token) {
            router.replace('/')
        } else {
            setChecking(false)
        }
    }, [])

    if (checking) return null

    return <>{children}</>
}
