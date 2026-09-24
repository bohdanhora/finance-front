"use client";

import { useTranslations } from "next-intl";
import { Layers, Plus } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { AnimatedMoney } from "components/animated-number";
import { CardDialog } from "components/cards/card-dialog";
import { CardFace, useCardName } from "components/cards/card-face";
import { ALL_CARDS, resolveCardFilter } from "lib/cards";
import { getCurrencySymbol } from "lib/currency";
import useStore from "store/general";

const tileClass =
    "relative w-36 shrink-0 cursor-pointer snap-start rounded-2xl outline-none transition-[transform,opacity,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-indigo-400 sm:w-44";

export const CardSwitcher = () => {
    const t = useTranslations("cards");
    const cards = useStore((state) => state.cards);
    const totalAmount = useStore((state) => state.totalAmount);
    const selectedCardId = useStore((state) => state.selectedCardId);
    const setSelectedCardId = useStore((state) => state.setSelectedCardId);
    const symbol = getCurrencySymbol(useStore((state) => state.userCurrency));
    const cardName = useCardName();

    const active = resolveCardFilter(selectedCardId, cards);
    const showAll = cards.length > 1;
    const selectedClass = "ring-2 ring-indigo-500 ring-offset-2 ring-offset-card";
    const idleClass = "opacity-75 hover:opacity-100 hover:-translate-y-0.5";

    return (
        <div
            role="listbox"
            aria-label={t("switcherLabel")}
            className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pt-1 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {showAll && (
                <button
                    type="button"
                    role="option"
                    aria-selected={active === ALL_CARDS}
                    onClick={() => setSelectedCardId(ALL_CARDS)}
                    className={twMerge(tileClass, active === ALL_CARDS ? selectedClass : idleClass)}
                >
                    <div className="bg-muted/70 ring-border flex aspect-[1.586] w-full flex-col justify-between rounded-2xl p-3.5 text-left ring-1">
                        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
                            <Layers className="size-3.5 text-indigo-500" />
                            {t("allCards")}
                        </span>
                        <span className="min-w-0">
                            <span className="text-muted-foreground block text-xs">
                                {t("cardsCount", { count: cards.length })}
                            </span>
                            <span className="block truncate text-lg leading-tight font-semibold tabular-nums">
                                <AnimatedMoney
                                    value={totalAmount}
                                    symbol={symbol}
                                    symbolClassName="text-muted-foreground"
                                />
                            </span>
                        </span>
                    </div>
                </button>
            )}

            {cards.map((card) => {
                const selected = showAll ? active === card.id : true;
                return (
                    <button
                        key={card.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => setSelectedCardId(card.id)}
                        className={twMerge(tileClass, selected ? selectedClass : idleClass)}
                    >
                        <CardFace skin={card.skin} name={cardName(card)} balance={card.balance} symbol={symbol} />
                    </button>
                );
            })}

            <CardDialog
                trigger={
                    <button
                        type="button"
                        aria-label={t("addTitle")}
                        className={twMerge(
                            tileClass,
                            "border-border text-muted-foreground hover:text-foreground flex aspect-[1.586] flex-col items-center justify-center gap-1.5 border-2 border-dashed text-sm font-medium hover:border-indigo-400/60 hover:bg-indigo-500/5",
                        )}
                    >
                        <Plus className="size-5" />
                        {t("addCard")}
                    </button>
                }
            />
        </div>
    );
};
