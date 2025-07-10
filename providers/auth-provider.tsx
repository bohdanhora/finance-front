'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Routes } from 'constants/routes'
import Cookies from 'js-cookie'
import { Loader } from 'components/loader.component'

export const PrivateProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const router = useRouter()

    useEffect(() => {
        const token = Cookies.get('accessToken')

        if (!token) {
            router.push(Routes.LOGIN)
            setIsAuthenticated(false)
        } else {
            setIsAuthenticated(true)
        }
    }, [])

    if (isAuthenticated === null || !isAuthenticated) {
        return null
    }

    return <>{children}</>
}

export const PublicProvider = ({ children }: { children: ReactNode }) => {
    const [checking, setChecking] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const token = Cookies.get('accessToken')

        if (token) {
            router.replace(Routes.HOME)
        } else {
            setChecking(false)
        }
    }, [router])

    if (checking) return <Loader />

    return <>{children}</>
}
