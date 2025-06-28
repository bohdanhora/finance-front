'use client'

import { useEffect, useState } from 'react'
import { useGetCurrencyQuery } from 'api/bank.api'
import useBankStore from 'store/bank.store'
import { LangugaeDropdown } from './language-dropdown.component'
import { CurrencyDropdown } from './currency-dropdown.component'
import ThemeSwitch from './theme-switch.component'
import { findCurrency } from 'lib/utils'
import { CURRENCY, ISO4217Codes } from 'constants/index'
import { Loader } from './loader.component'
import Image from 'next/image'
import { toast } from 'react-toastify'
import { useTranslations } from 'next-intl'

export default function Navbar() {
    const {
        data: currency,
        isPending: currencyPending,
        isError,
    } = useGetCurrencyQuery()
    const [buy, setBuy] = useState(0)
    const store = useBankStore()
    const t = useTranslations('errors')

    useEffect(() => {
        if (!currency) return

        const usdObj = findCurrency(currency, ISO4217Codes.USD) || null
        const eurObj = findCurrency(currency, ISO4217Codes.EUR) || null

        store.setUsd(usdObj)
        store.setEur(eurObj)
    }, [currency])

    useEffect(() => {
        if (store.currency === CURRENCY.EUR) {
            setBuy(store.eur?.rateBuy || 0)
            return
        }
        if (store.currency === CURRENCY.USD) {
            setBuy(store.usd?.rateBuy || 0)
            return
        }
        setBuy(0)
    }, [store.currency, store.usd, store.eur])

    useEffect(() => {
        if (isError) toast.error(t('apiFailed'))
    }, [isError])

    return (
        <>
            {currencyPending && <Loader />}
            <nav className="w-full border-b border-black/50 dark:border-white/50 py-4 px-6 flex justify-between items-center">
                <Image src="/logo.png" alt="logo" width={40} height={40} />
                <div className="flex items-center gap-x-3">
                    <p>
                        {`1 ${store.currency === CURRENCY.USD ? '$' : '€'} = ${buy} ₴`}
                    </p>
                    <CurrencyDropdown />
                    <LangugaeDropdown />
                    <ThemeSwitch />
                </div>
            </nav>
        </>
    )
}
