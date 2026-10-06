import { twMerge } from "lib/tw";
import { STREAK_TIERS, StreakTierKey } from "lib/streak";

const LIT_TIERS = STREAK_TIERS.filter((tier) => tier.from > 0);

const HEIGHTS = ["h-2/5", "h-3/5", "h-4/5", "h-full"];

export const StreakMeter = ({
    tier,
    live = false,
    className,
    cellClassName,
}: {
    tier: StreakTierKey;
    live?: boolean;
    className?: string;
    cellClassName?: string;
}) => {
    const reached = LIT_TIERS.findIndex((item) => item.key === tier);

    return (
        <span aria-hidden="true" className={twMerge("flex items-end gap-0.5", className)}>
            {LIT_TIERS.map((item, index) => (
                <span
                    key={item.key}
                    className={twMerge(
                        "block w-1",
                        HEIGHTS[index],
                        index <= reached ? "bg-accent" : "bg-rule",
                        index === reached && live && "streak-live",
                        cellClassName,
                    )}
                />
            ))}
        </span>
    );
};
