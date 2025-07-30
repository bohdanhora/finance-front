"use client";

import { useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Button } from "components/ui/button";
import { ContentWrapper } from "./wrappers/container";

import type { TransactionType } from "types/transactions";
import { TransactionEnum } from "constants/index";
import { formatCurrency } from "lib/utils";
import { useTranslations } from "next-intl";

ChartJS.register(ArcElement, Tooltip);

type Props = {
    transactions: TransactionType[];
};

export const CategoryChart = ({ transactions }: Props) => {
    const tCat = useTranslations("categories");
    const t = useTranslations("transactions");

    const [showChart, setShowChart] = useState(false);

    const chartInfo = useMemo(() => {
        const categoryMap = new Map<string, number>();

        transactions
            .filter((tx) => tx.transactionType === TransactionEnum.EXPENCE)
            .forEach((tx) => {
                const current = categoryMap.get(tx.categorie) || 0;
                categoryMap.set(tx.categorie, current + tx.value);
            });

        const total = Array.from(categoryMap.values()).reduce((acc, val) => acc + val, 0);

        const sorted = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, value], index) => ({
                name,
                value,
                percent: +((value / total) * 100).toFixed(1),
                color: COLORS[index % COLORS.length],
            }));

        const labels = sorted.map((item) => tCat(item.name));
        const data = sorted.map((item) => item.value);
        const backgroundColor = sorted.map((item) => item.color);

        return {
            total,
            chartData: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor,
                        borderWidth: 1,
                    },
                ],
            },
            categories: sorted,
        };
    }, [transactions]);

    return (
        <ContentWrapper className="w-fit">
            <Button onClick={() => setShowChart((prev) => !prev)}>{showChart ? t("hideChart") : t("openChart")}</Button>

            {showChart && (
                <div className="mt-6 flex flex-col md:flex-row gap-6 items-start justify-center">
                    <div className="w-full">
                        <Pie
                            data={chartInfo.chartData}
                            options={{
                                plugins: {
                                    legend: { display: false },
                                },
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        {chartInfo.categories.map((cat) => (
                            <div key={cat.name} className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium gap-x-10">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {tCat(cat.name)}
                                    </div>
                                    <span>{formatCurrency(cat.value)}</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded">
                                    <div
                                        className="h-2 rounded"
                                        style={{
                                            width: `${cat.percent}%`,
                                            backgroundColor: cat.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ContentWrapper>
    );
};

const COLORS = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#FF8A65",
    "#9575CD",
    "#4DB6AC",
    "#D4E157",
];
