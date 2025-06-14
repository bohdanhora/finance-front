'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '../lib/utils'
import useStore from '../store/general.store'
import ExpenseDialogComponent from './dialogs/expense-dialog.component'
import IncomeDialogComponent from './dialogs/income-dialog.component'
import useBankStore from '../store/bank.store'
import { CURRENCY } from '../constants'

export default function Total() {
    const [toDollar, setToDollar] = useState(0)
    const [toEuro, setToEuro] = useState(0)

    const store = useStore()

    const bankStore = useBankStore()

    const converted =
        bankStore.currency === CURRENCY.USD
            ? `${formatCurrency(toDollar)} $`
            : `${formatCurrency(toEuro)} €`

    useEffect(() => {
        if (bankStore.usd?.rateBuy) {
            setToDollar(store.total / bankStore.usd.rateBuy)
        }

        if (bankStore.eur?.rateBuy) {
            setToEuro(store.total / bankStore.eur.rateBuy)
        }

        console.log(store)
    }, [store.total, bankStore.usd?.rateBuy, bankStore.eur?.rateBuy])

    return (
        <header className="flex items-center justify-center gap-10">
            <IncomeDialogComponent />

            <div className="text-center">
                <h1 className="md:text-9xl text-xl">
                    {formatCurrency(store.total)} ₴
                </h1>
                <p>≈</p>
                <p>{converted}</p>
            </div>

            <ExpenseDialogComponent />
        </header>
    )
}
