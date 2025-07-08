'use client'

import { ReactNode, useEffect } from 'react'
import { useAllTransactionInfo } from 'api/main.api'
import useStore from 'store/general.store'
import { Loader } from 'components/loader.component'
import { useRouter } from 'next/navigation'
import { Routes } from 'constants/routes'
import { clearCookies } from 'lib/logout'

export const GetDataProvider = ({ children }: { children: ReactNode }) => {
    const store = useStore()
    const router = useRouter()

    const {
        data: allTransactionsData,
        isPending,
        error,
    } = useAllTransactionInfo()

    useEffect(() => {
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as any
            const message = axiosError?.response?.data?.message

            if (message === 'User dont found') {
                clearCookies()
                router.replace(Routes.LOGIN)
            }
        }
    }, [error, router])

    useEffect(() => {
        if (!allTransactionsData) return

        store.setTotalAmount(allTransactionsData.totalAmount || 0)
        store.setNextMonthTotalAmount(
            allTransactionsData.nextMonthTotalAmount || 0
        )
        store.setEssentialsArray(allTransactionsData.essentialsArray || [])
        store.setNextMonthEssentialsArray(
            allTransactionsData.nextMonthEssentialsArray || []
        )
    }, [allTransactionsData])

    if (isPending) {
        return <Loader />
    }

    return <>{children}</>
}
