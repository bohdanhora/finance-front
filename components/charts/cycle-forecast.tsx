"use client";

import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    Tooltip,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    type ScriptableScaleContext,
    type TooltipItem,
} from "chart.js";
import { useTranslations } from "next-intl";

import { ProjectionPoint } from "lib/pay-cycle";
import { formatSignedCurrency } from "lib/utils";
import { Legend, usePalette } from "./spending-charts";

ChartJS.register(Tooltip, CategoryScale, LinearScale, PointElement, LineElement);

export const CycleForecast = ({ points, symbol }: { points: ProjectionPoint[]; symbol: string }) => {
    const t = useTranslations("payCycle");
    const palette = usePalette();

    if (points.length < 2) return null;

    const monoFamily =
        typeof document === "undefined"
            ? ""
            : getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim();
    const font = { family: monoFamily ? `${monoFamily}, monospace` : "monospace", size: 10 };

    const line = {
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 12,
        pointHoverRadius: 4,
        pointHoverBorderColor: palette.paper,
        pointHoverBorderWidth: 2,
        tension: 0,
    };

    return (
        <div>
            <Legend
                items={[
                    { label: t("forecastPlan"), color: palette.accent },
                    { label: t("forecastPace"), color: palette.tick },
                ]}
            />
            <div className="h-56 w-full">
                <Line
                    data={{
                        labels: points.map((point) => point.date.format("DD.MM")),
                        datasets: [
                            {
                                ...line,
                                label: t("forecastPlan"),
                                data: points.map((point) => point.plan),
                                borderColor: palette.accent,
                                pointHoverBackgroundColor: palette.accent,
                            },
                            {
                                ...line,
                                label: t("forecastPace"),
                                data: points.map((point) => point.pace),
                                borderColor: palette.tick,
                                borderDash: [5, 4],
                                pointHoverBackgroundColor: palette.tick,
                            },
                        ],
                    }}
                    options={{
                        maintainAspectRatio: false,
                        interaction: { mode: "index", intersect: false },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: palette.paper,
                                titleColor: palette.ink,
                                bodyColor: palette.ink,
                                borderColor: palette.rule,
                                borderWidth: 1,
                                cornerRadius: 10,
                                padding: 10,
                                boxPadding: 4,
                                usePointStyle: true,
                                titleFont: font,
                                bodyFont: { ...font, size: 11 },
                                callbacks: {
                                    label: (item: TooltipItem<"line">) =>
                                        ` ${item.dataset.label}: ${formatSignedCurrency(Number(item.parsed.y))} ${symbol}`,
                                },
                            },
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: palette.tick, font, maxTicksLimit: 8, maxRotation: 0 },
                                border: { color: palette.rule },
                            },
                            y: {
                                grid: {
                                    color: (context: ScriptableScaleContext) =>
                                        context.tick?.value === 0 ? palette.tick : palette.rule,
                                },
                                ticks: { color: palette.tick, font, maxTicksLimit: 5 },
                                border: { display: false },
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};
