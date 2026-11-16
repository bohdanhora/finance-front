import { PetMood, PetRewardKind, PetSlot, PetSpecies } from "../types/pet";
import { toDayKey } from "./streak";

export const PET_SPECIES: PetSpecies[] = ["bulldog", "monkey", "sphynx"];

export const PET_SHOP_TABS: (PetSlot | "extras")[] = ["head", "eyes", "neck", "background", "extras"];

export const PET_REWARD_GUIDE: { kind: PetRewardKind; amount: number }[] = [
    { kind: "visit", amount: 5 },
    { kind: "log", amount: 5 },
    { kind: "save", amount: 20 },
    { kind: "bills", amount: 30 },
    { kind: "streak", amount: 50 },
];

type DatedRecord = { date: string | Date; transactionType?: string };

const SAD_AFTER_DAYS = 3;

export const getPetMood = (transactions: DatedRecord[], now: Date = new Date()): PetMood => {
    const hour = now.getHours();
    if (hour >= 23 || hour < 6) return "sleepy";

    const days = transactions
        .filter((item) => item.transactionType !== "transfer")
        .map((item) => new Date(item.date))
        .filter((date) => !Number.isNaN(date.getTime()));

    if (days.length === 0) return "calm";

    const latest = new Date(Math.max(...days.map((date) => date.getTime())));
    if (toDayKey(latest) === toDayKey(now)) return "happy";

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfLatest = new Date(latest.getFullYear(), latest.getMonth(), latest.getDate()).getTime();
    const gap = Math.round((startOfToday - startOfLatest) / (24 * 60 * 60 * 1000));

    return gap >= SAD_AFTER_DAYS ? "sad" : "calm";
};
