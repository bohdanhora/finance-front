'use client'

import useStore from 'store/general.store'
import { ContentWrapper } from './wrappers/container.wrapper'
import { useEffect, useState } from 'react'
import { calculateDailyBudget, formatCurrency } from 'lib/utils'
import { useTranslations } from 'next-intl'
import useBankStore from 'store/bank.store'
import { CURRENCY } from 'constants/index'
import EssentialSpends from './dialogs/essential-spends.component'

export default function PossibleRemaining() {
    const store = useStore()
    const bankStore = useBankStore()
    const t = useTranslations('possible')

    const [state, setState] = useState({
        essentials: {
            totalEssentials: {
                default: 0,
                [CURRENCY.EUR]: 0,
                [CURRENCY.USD]: 0,
            },
            dailyAfterEssentials: {
                default: 0,
                [CURRENCY.EUR]: 0,
                [CURRENCY.USD]: 0,
            },
        },
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

        const totalEssentials = store.essentials.reduce((sum, item) => {
            return !item.checked ? sum + item.amount : sum
        }, 0)
        const { dailyBudget: dailyFromTotal, daysLeft } = calculateDailyBudget(
            store.total
        )
        const { dailyBudget: dailyAfterEssentials } = calculateDailyBudget(
            store.total - totalEssentials
        )

        setState({
            essentials: {
                totalEssentials: {
                    default: store.total - totalEssentials,
                    [CURRENCY.EUR]: totalEssentials / eurRate,
                    [CURRENCY.USD]: totalEssentials / usdRate,
                },
                dailyAfterEssentials: {
                    default: dailyAfterEssentials,
                    [CURRENCY.EUR]: dailyAfterEssentials / eurRate,
                    [CURRENCY.USD]: dailyAfterEssentials / usdRate,
                },
            },
            dailyBudget: dailyFromTotal,
            daysLeft,
            dailyBudgetToCurrency: {
                [CURRENCY.EUR]: dailyFromTotal / eurRate,
                [CURRENCY.USD]: dailyFromTotal / usdRate,
            },
        })
    }, [
        store.total,
        bankStore.usd?.rateBuy,
        bankStore.eur?.rateBuy,
        store.essentials,
    ])

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
            <div className="flex flex-col items-center justify-between">
                <span className="text-xl">
                    {`${formatCurrency(state.essentials.totalEssentials.default)} ₴`}
                </span>
                <span className="text-xs">
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.essentials.totalEssentials[CURRENCY.USD])} $`
                        : `${formatCurrency(state.essentials.totalEssentials[CURRENCY.EUR])} €`}
                </span>
                <p className="text-xs">{t('remainingAfterEssentials')}</p>
            </div>
            <div className="flex flex-col items-center justify-between">
                <span className="text-xl">
                    {`${formatCurrency(state.essentials.dailyAfterEssentials.default)} ₴`}
                </span>
                <span className="text-xs">
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.essentials.dailyAfterEssentials[CURRENCY.USD])} $`
                        : `${formatCurrency(state.essentials.dailyAfterEssentials[CURRENCY.EUR])} €`}
                </span>
                <p className="text-xs">{t('dailySpendingAvailable')}</p>
            </div>
            <EssentialSpends />
        </ContentWrapper>
    )
}
