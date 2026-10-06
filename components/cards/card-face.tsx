"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { AnimatedMoney } from "components/animated-number";
import { skinOf } from "lib/card-skins";
import { formatCurrency, formatSignedCurrency } from "lib/utils";
import { Card, CardSkin } from "types/transactions";

export const useCardName = () => {
    const t = useTranslations("cards");
    return (card: Pick<Card, "name" | "skin"> | null | undefined) =>
        card?.name?.trim() || (card && card.skin !== CardSkin.DEFAULT ? skinOf(card.skin).brand : null) || t("unnamed");
};

export const CardSwatch = ({ skin, cover, className }: { skin?: CardSkin; cover?: string; className?: string }) => (
    <span
        aria-hidden="true"
        className={twMerge(
            "ring-ink/20 inline-block size-2.5 shrink-0 bg-cover bg-center ring-1 ring-inset",
            className,
        )}
        style={{ backgroundColor: skinOf(skin).color, backgroundImage: cover ? `url(${cover})` : undefined }}
    />
);

export const CardFace = ({
    skin,
    name,
    balance,
    creditLimit = 0,
    symbol,
    cover,
    className,
    showBalance = true,
    compact = false,
}: {
    skin: CardSkin;
    name: string;
    balance?: number;
    creditLimit?: number;
    symbol?: string;
    cover?: string;
    className?: string;
    showBalance?: boolean;
    compact?: boolean;
}) => {
    const t = useTranslations("cards");
    const style = skinOf(skin);
    const isCredit = creditLimit > 0;
    const inDebt = balance !== undefined && balance < 0;
    const branded = !cover && Boolean(style.brand);
    const showName = branded && name !== style.brand;

    return (
        <div
            className={twMerge(
                "ring-ink/10 relative isolate flex aspect-card w-full flex-col justify-between gap-2 bg-cover bg-center text-left text-white ring-1 ring-inset",
                compact ? "rounded-card-sm p-2" : "rounded-card p-3 sm:p-3.5",
                className,
            )}
            style={{ backgroundColor: style.color, backgroundImage: cover ? `url(${cover})` : undefined }}
        >
            {cover && (
                <span
                    aria-hidden="true"
                    className={twMerge(
                        "absolute inset-0 -z-10 bg-black/35",
                        compact ? "rounded-card-sm" : "rounded-card",
                    )}
                />
            )}

            <div className="flex min-w-0 items-start justify-between gap-2">
                <span
                    className={twMerge(
                        "min-w-0 leading-tight break-words",
                        branded ? style.wordmark : "font-mono text-2xs tracking-wide uppercase",
                        compact && "text-3xs",
                    )}
                >
                    {branded ? style.brand : name}
                </span>
                {isCredit && !compact && (
                    <span className="shrink-0 rounded-sm border border-white/60 px-1 py-px font-mono text-3xs leading-none uppercase">
                        {t("creditBadge")}
                    </span>
                )}
            </div>

            {showBalance && (
                <div className="min-w-0">
                    {showName && !compact && (
                        <p className="mb-0.5 text-xs leading-tight break-words text-white/75">{name}</p>
                    )}
                    {balance !== undefined && (
                        <p
                            className={twMerge(
                                "figure leading-tight break-words",
                                compact ? "text-xs" : "text-base sm:text-lg",
                            )}
                        >
                            <AnimatedMoney
                                value={balance}
                                symbol={symbol ?? ""}
                                symbolClassName="text-white/60"
                                format={formatSignedCurrency}
                            />
                        </p>
                    )}
                    {balance !== undefined && isCredit && !compact && (
                        <p className="mt-0.5 font-mono text-3xs leading-snug break-words text-white/75 tabular-nums">
                            {inDebt
                                ? t("debtOnFace", {
                                      amount: `${formatCurrency(-balance)} / ${formatCurrency(creditLimit)}`,
                                  })
                                : t("limitOnFace", { amount: formatCurrency(creditLimit) })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
