'use client'

import useStore from '../store/general.store'
import { ContentWrapper } from './wrappers/container.wrapper'
import { useEffect, useState } from 'react'
import { calculateDailyBudget, formatCurrency } from '../lib/utils'
import { useTranslations } from 'next-intl'
import useBankStore from '../store/bank.store'
import { CURRENCY } from '../constants'
import EssentialSpends from './dialogs/essential-spends.component'

export default function PossibleRemaining() {
    const store = useStore()
    const bankStore = useBankStore()
    const t = useTranslations('possible')

    const [state, setState] = useState({
        dailyBudget: 0,
        daysLeft: 0,
        dailyBudgetToCurrency: {
            [CURRENCY.EUR]: 0,
            [CURRENCY.USD]: 0,
        },
    })

    useEffect(() => {
        const eurRate = bankStore.eur?.rateBuy || 0
        const usdRate = bankStore.usd?.rateBuy || 0

        const { dailyBudget: dailyFromTotal, daysLeft } = calculateDailyBudget(
            store.total
        )

        setState({
            dailyBudget: dailyFromTotal,
            daysLeft,
            dailyBudgetToCurrency: {
                [CURRENCY.EUR]: dailyFromTotal / eurRate,
                [CURRENCY.USD]: dailyFromTotal / usdRate,
            },
        })
    }, [store.total, bankStore.usd?.rateBuy, bankStore.eur?.rateBuy])

    return (
        <ContentWrapper className="flex gap-10 justify-center flex-wrap">
            <div className="flex flex-col items-center justify-between">
                <span className="text-xl">{state.daysLeft}</span>
                <p className="text-xs">{t('daysLeft')}</p>
            </div>

            <div className="flex flex-col items-center justify-between">
                <span className="text-xl">
                    {`${formatCurrency(state.dailyBudget)} ₴`}
                </span>
                <span className="text-xs">
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.dailyBudgetToCurrency[CURRENCY.USD])} $`
                        : `${formatCurrency(state.dailyBudgetToCurrency[CURRENCY.EUR])} €`}
                </span>
                <p className="text-xs">{t('dailyBudget')}</p>
            </div>
            <EssentialSpends />
        </ContentWrapper>
    )
}
