'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useAllTransactionInfo } from 'api/main.api'
import useStore from 'store/general.store'
import { Loader } from 'components/loader.component'

export const GetDataProvider = ({ children }: { children: ReactNode }) => {
    const store = useStore()

    const { data: allTransactionsData, isPending } = useAllTransactionInfo()

    useEffect(() => {
        if (!allTransactionsData) return

        store.setTotal(allTransactionsData.totalAmount || 0)
        store.setNextMonthIncome(allTransactionsData.nextMonthTotalAmount || 0)
        store.setFullEssentials(allTransactionsData.essentialsArray || [])
        store.setNextMonthFullEssentials(
            allTransactionsData.nextMonthEssentialsArray || []
        )
    }, [allTransactionsData])

    if (isPending) {
        return <Loader />
    }

    return <>{children}</>
}
