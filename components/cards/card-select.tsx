"use client";

import { useTranslations } from "next-intl";

import { CardSwatch, useCardName } from "components/cards/card-face";
import { Label } from "components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency } from "lib/utils";
import useStore from "store/general";

export const CardSelect = ({
    value,
    onChange,
    label,
    exclude,
    id = "card-select",
}: {
    value: string;
    onChange: (cardId: string) => void;
    label?: string;
    exclude?: string;
    id?: string;
}) => {
    const t = useTranslations("cards");
    const cards = useStore((state) => state.cards);
    const symbol = getCurrencySymbol(useStore((state) => state.userCurrency));
    const cardName = useCardName();
    const options = cards.filter((card) => card.id !== exclude);

    if (cards.length < 2 && !exclude) return null;

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{label ?? t("card")}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={t("chooseCard")} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                            <span className="flex min-w-0 items-center gap-2">
                                <CardSwatch skin={card.skin} />
                                <span className="truncate">{cardName(card)}</span>
                                <span className="text-muted-foreground tabular-nums">
                                    {formatCurrency(card.balance)} {symbol}
                                </span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
