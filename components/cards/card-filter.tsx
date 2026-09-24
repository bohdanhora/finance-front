"use client";

import { useTranslations } from "next-intl";
import { Layers } from "lucide-react";

import { CardSwatch, useCardName } from "components/cards/card-face";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { ALL_CARDS, resolveCardFilter } from "lib/cards";
import useStore from "store/general";

export const CardFilter = () => {
    const t = useTranslations("cards");
    const cards = useStore((state) => state.cards);
    const selectedCardId = useStore((state) => state.selectedCardId);
    const setSelectedCardId = useStore((state) => state.setSelectedCardId);
    const cardName = useCardName();

    if (cards.length < 2) return null;

    return (
        <Select value={resolveCardFilter(selectedCardId, cards)} onValueChange={setSelectedCardId}>
            <SelectTrigger aria-label={t("switcherLabel")} className="w-full sm:w-52">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL_CARDS}>
                    <span className="flex items-center gap-2">
                        <Layers className="size-4 text-indigo-500" />
                        {t("allCards")}
                    </span>
                </SelectItem>
                {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                        <span className="flex min-w-0 items-center gap-2">
                            <CardSwatch skin={card.skin} />
                            <span className="truncate">{cardName(card)}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
