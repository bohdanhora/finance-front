export type PetSpecies = "bulldog" | "monkey" | "sphynx";

export type PetSlot = "head" | "eyes" | "neck" | "background";

export type PetMood = "happy" | "calm" | "sad" | "sleepy";

export type PetEquipped = Record<PetSlot, string | null>;

export type PetRarity = "common" | "rare" | "epic" | "legendary";

export type PetItem = {
    id: string;
    slot: PetSlot;
    price: number;
    rarity: PetRarity;
};

export type Pet = {
    species: PetSpecies | null;
    coins: number;
    earned: number;
    owned: string[];
    equipped: PetEquipped;
    freezes: number;
    name: string | null;
};

export type PetRewardKind = "welcome" | "visit" | "log" | "save" | "bills" | "streak" | "achievement";

export type PetReward = {
    key: string;
    kind: PetRewardKind;
    amount: number;
    days?: number;
    achievement?: AchievementId;
    tier?: number;
};

export type PetResponse = {
    pet: Pet;
    catalog: PetItem[];
    freeze: { price: number; limit: number };
    achievements: Achievement[];
    achievementRewards: number[];
    granted?: PetReward[];
};

export type PetSyncPayload = { day: string; offset: number };
export type PetBuyPayload = { itemId: string };
export type PetEquipPayload = { slot: PetSlot; itemId: string | null };
export type PetProfilePayload = { species?: PetSpecies; name?: string };

export type AchievementId =
    | "chronicler"
    | "diary"
    | "steady"
    | "saver"
    | "dreamer"
    | "debtfree"
    | "surplus"
    | "earner"
    | "analyst"
    | "collector"
    | "dandy"
    | "wealthy"
    | "payself"
    | "untouchable"
    | "perfectweek"
    | "perfectmonth"
    | "rhythm"
    | "thrifty"
    | "pedant"
    | "veteran";

export type Achievement = {
    id: AchievementId;
    value: number;
    tier: number;
    targets: [number, number, number];
};
