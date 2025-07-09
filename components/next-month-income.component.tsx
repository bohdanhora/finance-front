'use client'

import { useTranslations } from 'next-intl'
import { calculateSavings, formatCurrency } from 'lib/utils'
import useBankStore from 'store/bank.store'
import useStore from 'store/general.store'
import { ContentWrapper } from './wrappers/container.wrapper'
import { useEffect, useState } from 'react'
import { CURRENCY } from 'constants/index'
import ChangeNextMonthIncome from './dialogs/change-next-month-income-dialog'
import NextMonthIncomeCalculate from './dialogs/next-month-income-calculate.component'
import EssentialSpends from './dialogs/essential-spends.component'

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
        const eurRate = bankStore.eur?.rateBuy || 0
        const usdRate = bankStore.usd?.rateBuy || 0

        const totalEssentials = store.nextMonthEssentialsArray.reduce(
            (sum, item) => {
                return !item.checked ? sum + item.amount : sum
            },
            0
        )

        const totalIncomeWithEssentials =
            store.nextMonthTotalAmount - totalEssentials

        const savedAfterEssentials = calculateSavings(totalIncomeWithEssentials)

        setState({
            totalIncome: {
                default: store.nextMonthTotalAmount,
                [CURRENCY.EUR]: store.nextMonthTotalAmount / eurRate,
                [CURRENCY.USD]: store.nextMonthTotalAmount / usdRate,
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
    }, [
        store.nextMonthTotalAmount,
        bankStore.usd?.rateBuy,
        bankStore.eur?.rateBuy,
        store.nextMonthEssentialsArray,
    ])

    return (
        <ContentWrapper className="flex gap-10 justify-center flex-wrap">
            <div className="flex mt-2 gap-x-5">
                <ChangeNextMonthIncome />
                <NextMonthIncomeCalculate />
            </div>
            <div className="flex flex-col items-center justify-between max-w-96">
                <span className="text-xl">
                    {`${formatCurrency(state.totalIncome.default)} ₴`}
                </span>
                <span className="text-xs">
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.totalIncome[CURRENCY.USD])} $`
                        : `${formatCurrency(state.totalIncome[CURRENCY.EUR])} €`}
                </span>

                <p className="text-xs">{t('totalMoneyIncome')}</p>
            </div>
            <div className="flex flex-col items-center justify-between">
                <span className="text-xl">
                    {`${formatCurrency(state.remainingIncome.default)} ₴`}
                </span>
                <span className="text-xs">
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.remainingIncome[CURRENCY.USD])} $`
                        : `${formatCurrency(state.remainingIncome[CURRENCY.EUR])} €`}
                </span>

                <p className="text-xs">{t('remainingAfterEssentials')}</p>
            </div>
            <div className="flex flex-col items-center justify-between">
                <span className="text-xl">
                    {`${formatCurrency(state.savedMoney.default)} ₴`}
                </span>
                <span className="text-xs">
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.savedMoney[CURRENCY.USD])} $`
                        : `${formatCurrency(state.savedMoney[CURRENCY.EUR])} €`}
                </span>

                <p className="text-xs">{t('saveMoney')}</p>
            </div>
            <div className="flex flex-col items-center justify-between">
                <span className="text-xl">
                    {`${formatCurrency(state.savedMoney.remaining.default)} ₴`}
                </span>
                <span className="text-xs">
                    {bankStore.currency === CURRENCY.USD
                        ? `${formatCurrency(state.savedMoney.remaining[CURRENCY.USD])} $`
                        : `${formatCurrency(state.savedMoney.remaining[CURRENCY.EUR])} €`}
                </span>

                <p className="text-xs">{t('saveMoneyAfterPercent')}</p>
            </div>
            <EssentialSpends nextMonth={true} />
        </ContentWrapper>
    )
}
