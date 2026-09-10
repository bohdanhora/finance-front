import { useId } from "react";

/** A round progress meter with the percentage in the middle. */
export const ProgressRing = ({
    value,
    complete = false,
    size = 88,
    stroke = 8,
}: {
    value: number;
    /** Switches the indigo ring to emerald once the goal is covered. */
    complete?: boolean;
    size?: number;
    stroke?: number;
}) => {
    const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const clamped = Math.min(Math.max(value, 0), 100);
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={complete ? "#10b981" : "#6366f1"} />
                        <stop offset="100%" stopColor={complete ? "#34d399" : "#8b5cf6"} />
                    </linearGradient>
                </defs>
                <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
                {clamped > 0 && (
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        strokeWidth={stroke}
                        stroke={`url(#${gradientId})`}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - clamped / 100)}
                        className="transition-[stroke-dashoffset] duration-700 ease-out"
                    />
                )}
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
                {Math.round(clamped)}%
            </span>
        </div>
    );
};
