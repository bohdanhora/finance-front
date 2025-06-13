'use client'

import { useEffect, useState } from 'react'
import { useGetCurrencyQuery } from '../api/bank.api'
import useStore from '../store/bank.store'
import { LangugaeDropdown } from './language-dropdown.component'
import { CurrencyDropdown } from './currency-dropdown.component'
import ThemeSwitch from './theme-switch.component'
import { findCurrency } from '../lib/utils'
import { CURRENCY, ISO4217Codes } from '../constants'
import { Loader } from './loader.component'

export default function Navbar() {
    const { data: currency, isPending: currencyPending } = useGetCurrencyQuery()
    const [buy, setBuy] = useState(0)
    const store = useStore()

    useEffect(() => {
        const usdObj = findCurrency(currency || [], ISO4217Codes.USD) || null
        const eurObj = findCurrency(currency || [], ISO4217Codes.EUR) || null

        store.setUsd(usdObj)
        store.setEur(eurObj)
    }, [currency])

    useEffect(() => {
        if (store.currency === CURRENCY.UAH) setBuy(1)
        if (store.currency === CURRENCY.EUR) setBuy(store.eur?.rateBuy)
        if (store.currency === CURRENCY.EN) setBuy(store.usd?.rateBuy)
    }, [store.currency])

    useEffect(() => {
        console.log(store.currency)
        console.log(store.eur)
        console.log(store.usd)
        console.log(buy)
    }, [])

    return (
        <>
            {currencyPending && <Loader />}

            <nav className="w-full border-b border-black/50 dark:border-white/50 py-4 px-6 flex justify-between items-center">
                <p>My Finance</p>
                <div className="flex items-center gap-x-3">
                    {buy}
                    <ThemeSwitch />
                    <CurrencyDropdown />
                    <LangugaeDropdown />
                </div>
            </nav>
        </>
    )
}
