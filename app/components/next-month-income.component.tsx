'use client'

import { useTranslations } from 'next-intl'
import { calculateSavings, formatCurrency } from '../lib/utils'
import useBankStore from '../store/bank.store'
import useStore from '../store/general.store'
import { ContentWrapper } from './wrappers/container.wrapper'
import { useEffect, useState } from 'react'
import { CURRENCY } from '../constants'
import ChangeNextMonthIncome from './dialogs/change-next-month-income-dialog'

const ESSENTIALS = 14000 + 3900 + 1300 + 600 + 300

export const NextMonthIncome = () => {
    const store = useStore()
    const bankStore = useBankStore()
    const t = useTranslations('possible')

    const [state, setState] = useState({
        totalIncome: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
        remainingIncome: {
            default: 0,
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
        savedMoney: {
            default: 0,
            remaining: {
                default: 0,
                [CURRENCY.USD]: 0,
                [CURRENCY.EUR]: 0,
            },
            [CURRENCY.USD]: 0,
            [CURRENCY.EUR]: 0,
        },
    })

    useEffect(() => {
        const totalIncomeWithEssentials = store.nextMonthIncome - ESSENTIALS

        const eurRate = bankStore.eur?.rateBuy || 0
        const usdRate = bankStore.usd?.rateBuy || 0

        const savedAfterEssentials = calculateSavings(totalIncomeWithEssentials)

        setState({
            totalIncome: {
                default: store.nextMonthIncome,
                [CURRENCY.EUR]: store.nextMonthIncome / eurRate,
                [CURRENCY.USD]: store.nextMonthIncome / usdRate,
            },
            remainingIncome: {
                default: totalIncomeWithEssentials,
                [CURRENCY.EUR]: totalIncomeWithEssentials / eurRate,
                [CURRENCY.USD]: totalIncomeWithEssentials / usdRate,
            },
            savedMoney: {
                default: savedAfterEssentials.saved,
                remaining: {
                    default: savedAfterEssentials.remaining,
                    [CURRENCY.USD]: savedAfterEssentials.remaining / usdRate,
                    [CURRENCY.EUR]: savedAfterEssentials.remaining / eurRate,
                },
                [CURRENCY.USD]: savedAfterEssentials.saved / usdRate,
                [CURRENCY.EUR]: savedAfterEssentials.saved / eurRate,
            },
        })
    }, [store.nextMonthIncome, bankStore.usd?.rateBuy, bankStore.eur?.rateBuy])

    return (
        <ContentWrapper>
            <p>
                {t('totalMoneyIncome', {
                    totalMoneyIncome: formatCurrency(state.totalIncome.default),
                })}
                <span className="text-xs">
                    {' '}
                    ≈{' '}
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.totalIncome[CURRENCY.USD])} $`
                        : `${formatCurrency(state.totalIncome[CURRENCY.EUR])} €`}
                </span>
                <ChangeNextMonthIncome />
            </p>
            <p>
                {t('remainingAfterEssentials', {
                    possible: formatCurrency(state.remainingIncome.default),
                })}
                <span className="text-xs">
                    {' '}
                    ≈{' '}
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.remainingIncome[CURRENCY.USD])} $`
                        : `${formatCurrency(state.remainingIncome[CURRENCY.EUR])} €`}
                </span>
            </p>
            <p>
                {t('saveMoney', {
                    saveMoney: formatCurrency(state.savedMoney.default),
                })}
                <span className="text-xs">
                    {' '}
                    ≈{' '}
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.savedMoney[CURRENCY.USD])} $`
                        : `${formatCurrency(state.savedMoney[CURRENCY.EUR])} €`}
                </span>
            </p>
            <p>
                {t('saveMoneyAfterPercent', {
                    saveMoneyAfterPercent: formatCurrency(
                        state.savedMoney.remaining.default
                    ),
                })}
                <span className="text-xs">
                    {' '}
                    ≈{' '}
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.savedMoney.remaining[CURRENCY.USD])} $`
                        : `${formatCurrency(state.savedMoney.remaining[CURRENCY.EUR])} €`}
                </span>
            </p>
        </ContentWrapper>
    )
}
