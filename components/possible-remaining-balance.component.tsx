'use client'

import useStore from 'store/general.store'
import { ContentWrapper } from './wrappers/container.wrapper'
import { useEffect, useState } from 'react'
import { calculateDailyBudget, formatCurrency } from 'lib/utils'
import { useTranslations } from 'next-intl'
import useBankStore from 'store/bank.store'
import { CURRENCY } from 'constants/index'
import EssentialSpends from './dialogs/essential-spends.component'
import ChangeDefaultEssentials from './dialogs/change-default-essentials-dialog.component'

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

        const totalEssentials = store.essentialsArray.reduce((sum, item) => {
            return !item.checked ? sum + item.amount : sum
        }, 0)

        const totalWithEssentials = store.totalAmount - totalEssentials

        const { dailyBudget: dailyFromTotal, daysLeft } = calculateDailyBudget(
            store.totalAmount
        )
        const { dailyBudget: dailyAfterEssentials } =
            calculateDailyBudget(totalWithEssentials)

        setState({
            essentials: {
                totalEssentials: {
                    default: totalWithEssentials,
                    [CURRENCY.EUR]: eurRate ? totalWithEssentials / eurRate : 0,
                    [CURRENCY.USD]: usdRate ? totalWithEssentials / usdRate : 0,
                },
                dailyAfterEssentials: {
                    default: dailyAfterEssentials,
                    [CURRENCY.EUR]: eurRate
                        ? dailyAfterEssentials / eurRate
                        : 0,
                    [CURRENCY.USD]: usdRate
                        ? dailyAfterEssentials / usdRate
                        : 0,
                },
            },
            dailyBudget: dailyFromTotal,
            daysLeft,
            dailyBudgetToCurrency: {
                [CURRENCY.EUR]: eurRate ? dailyFromTotal / eurRate : 0,
                [CURRENCY.USD]: usdRate ? dailyFromTotal / usdRate : 0,
            },
        })
    }, [
        store.totalAmount,
        bankStore.usd?.rateBuy,
        bankStore.eur?.rateBuy,
        store.essentialsArray,
    ])

    const renderCard = (
        title: string,
        valueUAH: number,
        valueCurrency: number,
        currencySymbol: string
    ) => (
        <ContentWrapper className="w-full sm:w-2xs">
            <span className="text-xl font-semibold">
                {formatCurrency(valueUAH)} ₴
            </span>
            <span className="text-sm">
                {formatCurrency(valueCurrency)} {currencySymbol}
            </span>
            <p className="text-base font-bold text-center mt-1">{title}</p>
        </ContentWrapper>
    )

    const currency = bankStore.currency as CURRENCY
    const getCurrencySymbol = () => (currency === CURRENCY.USD ? '$' : '€')

    return (
        <section className="w-full flex flex-col items-center gap-10">
            <div className="flex justify-center items-center gap-5 flex-wrap">
                <EssentialSpends />
                <ChangeDefaultEssentials />
            </div>
            <div className="flex gap-4 flex-wrap w-full justify-between">
                <ContentWrapper className="w-full sm:w-2xs">
                    <p className="text-base font-bold text-center mt-1">
                        {t('daysLeft')}
                    </p>

                    <span className="text-xl font-semibold">
                        {state.daysLeft}
                    </span>
                </ContentWrapper>
                {renderCard(
                    t('dailyBudget'),
                    state.dailyBudget,
                    state.dailyBudgetToCurrency[currency] ?? 0,
                    getCurrencySymbol()
                )}
                {renderCard(
                    t('remainingAfterEssentials'),
                    state.essentials.totalEssentials.default,
                    state.essentials.totalEssentials[currency] ?? 0,
                    getCurrencySymbol()
                )}
                {renderCard(
                    t('dailySpendingAvailable'),
                    state.essentials.dailyAfterEssentials.default,
                    state.essentials.dailyAfterEssentials[currency] ?? 0,
                    getCurrencySymbol()
                )}
            </div>
        </section>
    )
}
