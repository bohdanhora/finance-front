'use client'

import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { Pie, PieChart } from 'recharts'

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from 'components/ui/chart'

import useStore from 'store/general.store'
import { useTranslations } from 'next-intl'
import { ContentWrapper } from './wrappers/container.wrapper'
import { Button } from './ui/button'
import { twMerge } from 'tailwind-merge'
import { formatCurrency } from 'lib/utils'
import { ChartBarByDay } from './chart-bar-by-day.components'

type ChartConfigItem = {
    label: string
    color?: string
}
export function ChartPieByCategory() {
    const store = useStore()
    const tCategory = useTranslations('categories')
    const tChart = useTranslations('chart')

    const [showChart, setShowChart] = useState(false)

    const toggleChart = () => {
        setShowChart((prev) => !prev)
    }

    const generateColor = (index: number): string =>
        `var(--chart-${(index % 10) + 1}, hsl(${index * 36}, 70%, 60%))`

    const chartData = useMemo(() => {
        const totals: Record<string, number> = {}

        for (const tx of store.transactions) {
            if (tx.categorie === 'income') continue

            const categoryName = tCategory(tx.categorie)

            if (!totals[categoryName]) {
                totals[categoryName] = 0
            }

            totals[categoryName] += tx.value
        }

        return Object.entries(totals).map(([category, value], index) => ({
            category,
            value,
            fill: generateColor(index),
        }))
    }, [store.transactions, tCategory])

    const chartConfig = useMemo(() => {
        const config: Record<string, ChartConfigItem> = {
            value: { label: 'Total' },
        }

        chartData.forEach((item, index) => {
            config[item.category] = {
                label: item.category,
                color: generateColor(index),
            }
        })

        return config
    }, [chartData])

    if (!chartData.length) return null

    return (
        <ContentWrapper
            className={twMerge(
                'flex flex-col items-center gap-4',
                showChart ? 'w-full' : 'w-fit'
            )}
        >
            <div className="text-center">
                <h2 className="text-xl font-semibold">
                    {tChart('expensesByCategory')}
                </h2>
                <p className="text-muted-foreground text-sm">
                    {tChart('excludingIncomeTransactions')}
                </p>
            </div>

            <Button onClick={toggleChart} variant="outline">
                {showChart ? tChart('hideChart') : tChart('showChart')}
            </Button>

            {showChart && (
                <>
                    <div className="flex flex-col md:flex-row w-full max-w-xl items-center gap-8">
                        <ChartContainer
                            config={chartConfig}
                            className="w-full max-w-xl aspect-square"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            formatter={(value, name) =>
                                                `${name}: -${formatCurrency(Number(value)).toLocaleString()} ₴`
                                            }
                                        />
                                    }
                                />
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="category"
                                    stroke="0"
                                />
                            </PieChart>
                        </ChartContainer>

                        <div className="flex flex-col gap-2 text-sm">
                            {chartData.map((item) => (
                                <div
                                    key={item.category}
                                    className="flex items-center gap-2"
                                >
                                    <span
                                        className="inline-block w-4 h-4 rounded-sm"
                                        style={{ backgroundColor: item.fill }}
                                    ></span>
                                    <span>{item.category}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <ChartBarByDay />

                    <div className="text-sm text-muted-foreground text-center">
                        <div className="flex items-center justify-center gap-2 font-medium">
                            {tChart('basedOnRecentExpenses')}{' '}
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                            {tChart('totalTransactions', {
                                totalTransactions: store.transactions.length,
                            })}
                        </div>
                    </div>
                </>
            )}
        </ContentWrapper>
    )
}
