'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useAllTransactionInfo } from 'api/main.api'
import useStore from 'store/general.store'
import { Loader } from 'components/loader.component'

export const GetDataProvider = ({ children }: { children: ReactNode }) => {
    const store = useStore()

    const { data: allTransactionsData, isPending } = useAllTransactionInfo()

    const prevTotalRef = useRef<number | undefined>(0)
    const prevNextMonthRef = useRef<number | undefined>(0)

    useEffect(() => {
        if (!allTransactionsData) return

        if (prevTotalRef.current !== allTransactionsData.totalAmount) {
            store.setTotal(allTransactionsData.totalAmount || 0)
            prevTotalRef.current = allTransactionsData.totalAmount
        }

        if (
            prevNextMonthRef.current !==
            allTransactionsData.nextMonthTotalAmount
        ) {
            store.setNextMonthIncome(
                allTransactionsData.nextMonthTotalAmount || 0
            )
            prevNextMonthRef.current = allTransactionsData.nextMonthTotalAmount
        }
    }, [allTransactionsData, store])

    if (isPending) {
        return <Loader />
    }

    return <>{children}</>
}
