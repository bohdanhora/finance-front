"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Snowflake } from "lucide-react";

import { useBuyPetItem, useEquipPetItem } from "api/pet";
import { PET_SHOP_TABS } from "lib/pet";
import { twMerge } from "lib/tw";
import { Pet, PetItem, PetRarity, PetSlot, PetSpecies } from "types/pet";
import { Button } from "ui/button";

import { Coin } from "./coin";
import { PetArt } from "./pet-art";

type Tab = PetSlot | "extras";

const RARITY_TEXT: Record<PetRarity, string> = {
    common: "text-ink-faint",
    rare: "text-sky-400",
    epic: "text-violet-400",
    legendary: "text-amber-400",
};

const RARITY_CARD: Record<PetRarity, string> = {
    common: "border-rule",
    rare: "border-sky-400/30",
    epic: "border-violet-400/50",
    legendary: "border-amber-400/70 shadow-lg shadow-amber-400/10",
};

const ItemCard = ({ item, pet, species }: { item: PetItem; pet: Pet; species: PetSpecies }) => {
    const t = useTranslations("pet");
    const { mutate: buy, isPending: buying } = useBuyPetItem();
    const { mutate: equip, isPending: equipping } = useEquipPetItem();

    const owned = pet.owned.includes(item.id);
    const worn = pet.equipped[item.slot] === item.id;
    const affordable = pet.coins >= item.price;
    const busy = buying || equipping;

    return (
        <li
            className={twMerge(
                "bg-wash flex flex-col gap-2 rounded-2xl border p-2",
                RARITY_CARD[item.rarity],
                worn && "border-accent",
            )}
        >
            <PetArt
                species={species}
                equipped={{ ...pet.equipped, [item.slot]: item.id }}
                className="aspect-square w-full"
                title={t(`items.${item.id}`)}
            />
            <div className="flex min-h-11 items-start justify-between gap-2 px-1">
                <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{t(`items.${item.id}`)}</span>
                    <span className={twMerge("label block text-3xs", RARITY_TEXT[item.rarity])}>
                        {t(`rarity.${item.rarity}`)}
                    </span>
                </span>
                {worn && <Check className="text-accent mt-0.5 size-4 shrink-0" />}
            </div>
            {owned ? (
                <Button
                    variant={worn ? "outline" : "secondary"}
                    size="sm"
                    disabled={busy || (worn && item.slot === "background")}
                    onClick={() => equip({ slot: item.slot, itemId: worn ? null : item.id })}
                >
                    {worn ? (item.slot === "background" ? t("worn") : t("takeOff")) : t("wear")}
                </Button>
            ) : (
                <Button
                    variant={affordable ? "accent" : "outline"}
                    size="sm"
                    disabled={busy || !affordable}
                    onClick={() => buy({ itemId: item.id })}
                    aria-label={t("buyFor", { item: t(`items.${item.id}`), price: item.price })}
                >
                    <Coin className="size-3.5" />
                    <span className="font-mono tabular-nums">{item.price}</span>
                </Button>
            )}
        </li>
    );
};

const FreezeCard = ({ pet, price, limit }: { pet: Pet; price: number; limit: number }) => {
    const t = useTranslations("pet");
    const { mutate: buy, isPending } = useBuyPetItem();
    const full = pet.freezes >= limit;

    return (
        <div className="border-rule bg-wash flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-400">
                <Snowflake className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="font-medium">{t("freeze.title")}</p>
                <p className="text-ink-muted mt-1 text-sm leading-relaxed">{t("freeze.body")}</p>
                <p className="label mt-2">{t("freeze.owned", { count: pet.freezes, limit })}</p>
            </div>
            <Button
                variant={full ? "outline" : "accent"}
                disabled={isPending || full || pet.coins < price}
                onClick={() => buy({ itemId: "freeze" })}
            >
                {full ? (
                    t("freeze.full")
                ) : (
                    <>
                        <Coin className="size-3.5" />
                        <span className="font-mono tabular-nums">{price}</span>
                    </>
                )}
            </Button>
        </div>
    );
};

export const PetShop = ({
    pet,
    species,
    catalog,
    freeze,
}: {
    pet: Pet;
    species: PetSpecies;
    catalog: PetItem[];
    freeze: { price: number; limit: number };
}) => {
    const t = useTranslations("pet");
    const [tab, setTab] = useState<Tab>("head");
    const items = catalog.filter((item) => item.slot === tab).sort((a, b) => a.price - b.price);

    return (
        <div className="grid gap-4">
            <div className="no-scrollbar bg-wash flex max-w-full gap-1 overflow-x-auto rounded-xl p-1">
                {PET_SHOP_TABS.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setTab(item)}
                        aria-pressed={tab === item}
                        className={twMerge(
                            "text-ink-muted h-8 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors",
                            tab === item ? "bg-surface text-ink shadow-lg" : "hover:text-ink",
                        )}
                    >
                        {t(`slots.${item}`)}
                    </button>
                ))}
            </div>

            {tab === "extras" ? (
                <FreezeCard pet={pet} price={freeze.price} limit={freeze.limit} />
            ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                    {items.map((item) => (
                        <ItemCard key={item.id} item={item} pet={pet} species={species} />
                    ))}
                </ul>
            )}
        </div>
    );
};
