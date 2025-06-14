'use client'

import useStore from '../store/general.store'
import { ContentWrapper } from './wrappers/container.wrapper'
import { useEffect, useState } from 'react'
import { calculateDailyBudget, formatCurrency } from '../lib/utils'
import { useTranslations } from 'next-intl'
import useBankStore from '../store/bank.store'
import { CURRENCY } from '../constants'

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
        <ContentWrapper className="">
            <p>
                {t('daysLeft', {
                    days: state.daysLeft,
                })}
            </p>

            <p>
                {t('dailyBudget', {
                    dailyBudget: formatCurrency(state.dailyBudget),
                })}
                <span className="text-xs">
                    {' '}
                    ≈{' '}
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.dailyBudgetToCurrency[CURRENCY.USD])} $`
                        : `${formatCurrency(state.dailyBudgetToCurrency[CURRENCY.EUR])} €`}
                </span>
            </p>
        </ContentWrapper>
    )
}
