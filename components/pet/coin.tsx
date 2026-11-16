import { twMerge } from "lib/tw";

export const Coin = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={twMerge("size-4 shrink-0", className)}>
        <circle cx={12} cy={12} r={11} fill="#f5b941" />
        <circle cx={12} cy={12} r={8} fill="#ffd36b" stroke="#d99a1e" strokeWidth={1.5} />
        <path
            d="M12 7.5v9M9.5 10a2.5 2 0 0 1 5 0c0 2.6-5 1.4-5 4a2.5 2 0 0 0 5 0"
            fill="none"
            stroke="#b7791f"
            strokeWidth={1.6}
            strokeLinecap="round"
        />
    </svg>
);
