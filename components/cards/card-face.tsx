"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { AnimatedMoney } from "components/animated-number";
import { skinOf } from "lib/card-skins";
import { formatCurrency, formatSignedCurrency } from "lib/utils";
import { Card, CardSkin } from "types/transactions";

export const useCardName = () => {
    const t = useTranslations("cards");
    return (card: Pick<Card, "name" | "skin"> | null | undefined) =>
        card?.name?.trim() || (card && card.skin !== CardSkin.DEFAULT ? skinOf(card.skin).brand : null) || t("unnamed");
};

export const CardSwatch = ({ skin, className }: { skin?: CardSkin; className?: string }) => (
    <span
        aria-hidden="true"
        className={twMerge("inline-block h-4 w-6 shrink-0 rounded-[4px] shadow-sm", skinOf(skin).swatch, className)}
    />
);

const Chip = () => (
    <span
        aria-hidden="true"
        className="block h-5 w-7 rounded-[5px] bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 opacity-90 shadow-inner"
    />
);

export const CardFace = ({
    skin,
    name,
    balance,
    creditLimit = 0,
    symbol,
    className,
    showBalance = true,
    compact = false,
}: {
    skin: CardSkin;
    name: string;
    balance?: number;
    creditLimit?: number;
    symbol?: string;
    className?: string;
    showBalance?: boolean;
    compact?: boolean;
}) => {
    const t = useTranslations("cards");
    const style = skinOf(skin);
    const isCredit = creditLimit > 0;
    const inDebt = balance !== undefined && balance < 0;

    return (
        <div
            className={twMerge(
                "relative isolate flex aspect-[1.586] w-full flex-col justify-between overflow-hidden text-left shadow-md",
                compact ? "rounded-lg p-2" : "rounded-2xl p-3.5",
                style.surface,
                style.text,
                className,
            )}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -right-8 -z-10 size-28 rounded-full bg-white/10 blur-2xl"
            />
            <div className="flex items-start justify-between gap-2">
                <span className={twMerge("truncate leading-none", style.wordmark, compact && "text-[0.6rem]")}>
                    {style.brand ?? name}
                </span>
                {!compact && (
                    <span className="flex items-center gap-1.5">
                        {isCredit && (
                            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[0.6rem] leading-none font-semibold tracking-wide uppercase">
                                {t("creditBadge")}
                            </span>
                        )}
                        <Chip />
                    </span>
                )}
            </div>
            <div className="min-w-0">
                {style.brand && !compact && name !== style.brand && (
                    <p className={twMerge("truncate text-xs font-medium", style.muted)}>{name}</p>
                )}
                {showBalance && balance !== undefined && (
                    <p className="truncate text-lg leading-tight font-semibold tabular-nums">
                        <AnimatedMoney
                            value={balance}
                            symbol={symbol ?? ""}
                            symbolClassName={style.muted}
                            format={formatSignedCurrency}
                        />
                    </p>
                )}
                {showBalance && balance !== undefined && isCredit && !compact && (
                    <p className={twMerge("truncate text-[0.65rem] leading-tight tabular-nums", style.muted)}>
                        {inDebt
                            ? t("debtOnFace", {
                                  amount: `${formatCurrency(-balance)} / ${formatCurrency(creditLimit)}`,
                              })
                            : t("limitOnFace", { amount: formatCurrency(creditLimit) })}
                    </p>
                )}
            </div>
        </div>
    );
};
