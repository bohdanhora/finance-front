'use client'

import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { useMemo } from 'react'
import useStore from 'store/general.store'
import { formatCurrency } from 'lib/utils'

export function ChartBarByDay() {
    const store = useStore()

    const data = useMemo(() => {
        const dailyTotals: Record<string, number> = {}

        for (const tx of store.transactions) {
            if (tx.categorie === 'income') continue

            const date = new Date(tx.date).toISOString().split('T')[0]

            if (!dailyTotals[date]) {
                dailyTotals[date] = 0
            }

            dailyTotals[date] += tx.value
        }

        return Object.entries(dailyTotals)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, total]) => ({ date, total }))
    }, [store.transactions])

    if (!data.length) return null

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getDate()}.${date.getMonth() + 1}`
                            }}
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={60}
                        />
                        <YAxis tickFormatter={(v) => `${Math.round(v)}`} />
                        <Tooltip
                            formatter={(value) =>
                                `-${formatCurrency(Number(value))} ₴`
                            }
                            labelFormatter={(label) =>
                                new Date(label).toLocaleDateString()
                            }
                        />
                        <Bar dataKey="total" fill="var(--chart-1, #3b82f6)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
