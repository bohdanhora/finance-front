import { CardSkin } from "types/transactions";

export type CardSkinStyle = {
    id: CardSkin;
    brand: string | null;
    color: string;
    wordmark: string;
};

export const CARD_SKINS: Record<CardSkin, CardSkinStyle> = {
    [CardSkin.DEFAULT]: {
        id: CardSkin.DEFAULT,
        brand: null,
        color: "#2531e0",
        wordmark: "font-mono text-2xs tracking-wide uppercase",
    },
    [CardSkin.MONOBANK]: {
        id: CardSkin.MONOBANK,
        brand: "monobank",
        color: "#1a1a1a",
        wordmark: "font-sans text-sm font-semibold lowercase tracking-tight",
    },
    [CardSkin.PUMB]: {
        id: CardSkin.PUMB,
        brand: "ПУМБ",
        color: "#d71f26",
        wordmark: "font-display text-sm font-semibold tracking-wide",
    },
    [CardSkin.ROZETKA]: {
        id: CardSkin.ROZETKA,
        brand: "ROZETKA",
        color: "#00a046",
        wordmark: "font-display text-xs font-semibold tracking-wider",
    },
};

export const CARD_SKIN_ORDER: CardSkin[] = [CardSkin.MONOBANK, CardSkin.PUMB, CardSkin.ROZETKA, CardSkin.DEFAULT];

export const skinOf = (skin?: CardSkin) => CARD_SKINS[skin ?? CardSkin.DEFAULT] ?? CARD_SKINS[CardSkin.DEFAULT];
