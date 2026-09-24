import { CardSkin } from "types/transactions";

export type CardSkinStyle = {
    id: CardSkin;
    brand: string | null;
    surface: string;
    swatch: string;
    text: string;
    muted: string;
    wordmark: string;
};

export const CARD_SKINS: Record<CardSkin, CardSkinStyle> = {
    [CardSkin.DEFAULT]: {
        id: CardSkin.DEFAULT,
        brand: null,
        surface: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700",
        swatch: "bg-gradient-to-br from-indigo-500 to-violet-700",
        text: "text-white",
        muted: "text-white/70",
        wordmark: "text-[0.7rem] font-semibold tracking-[0.18em] uppercase",
    },
    [CardSkin.MONOBANK]: {
        id: CardSkin.MONOBANK,
        brand: "monobank",
        surface: "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black ring-1 ring-white/10",
        swatch: "bg-gradient-to-br from-zinc-700 to-black",
        text: "text-white",
        muted: "text-white/60",
        wordmark: "text-sm font-bold tracking-tight lowercase",
    },
    [CardSkin.PUMB]: {
        id: CardSkin.PUMB,
        brand: "ПУМБ",
        surface: "bg-gradient-to-br from-[#ef3b33] via-[#d71f26] to-[#9d1119]",
        swatch: "bg-gradient-to-br from-[#ef3b33] to-[#9d1119]",
        text: "text-white",
        muted: "text-white/75",
        wordmark: "text-sm font-extrabold tracking-wide",
    },
    [CardSkin.ROZETKA]: {
        id: CardSkin.ROZETKA,
        brand: "ROZETKA",
        surface: "bg-gradient-to-br from-[#10b95a] via-[#00a046] to-[#006b2e]",
        swatch: "bg-gradient-to-br from-[#10b95a] to-[#006b2e]",
        text: "text-white",
        muted: "text-white/75",
        wordmark: "text-[0.8rem] font-black tracking-[0.06em]",
    },
};

export const CARD_SKIN_ORDER: CardSkin[] = [CardSkin.MONOBANK, CardSkin.PUMB, CardSkin.ROZETKA, CardSkin.DEFAULT];

export const skinOf = (skin?: CardSkin) => CARD_SKINS[skin ?? CardSkin.DEFAULT] ?? CARD_SKINS[CardSkin.DEFAULT];
