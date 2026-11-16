export type PetSpecies = "bulldog" | "monkey" | "sphynx";

export type PetSlot = "head" | "eyes" | "neck" | "background";

export type PetMood = "happy" | "calm" | "sad" | "sleepy";

export type PetEquipped = Record<PetSlot, string | null>;

export type PetItem = {
    id: string;
    slot: PetSlot;
    price: number;
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

export type PetRewardKind = "welcome" | "visit" | "log" | "save" | "bills" | "streak";

export type PetReward = {
    key: string;
    kind: PetRewardKind;
    amount: number;
    days?: number;
};

export type PetResponse = {
    pet: Pet;
    catalog: PetItem[];
    freeze: { price: number; limit: number };
    granted?: PetReward[];
};

export type PetSyncPayload = { day: string; offset: number };
export type PetBuyPayload = { itemId: string };
export type PetEquipPayload = { slot: PetSlot; itemId: string | null };
export type PetProfilePayload = { species?: PetSpecies; name?: string };
