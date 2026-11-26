"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Snowflake } from "lucide-react";

import { useUpdatePetProfile } from "api/pet";
import { PET_REWARD_GUIDE } from "lib/pet";
import { Pet, PetMood, PetSpecies } from "types/pet";
import { Button } from "ui/button";
import { Input } from "ui/input";

import { Coin } from "./coin";
import { PetArt } from "./pet-art";

export const PetHome = ({
    pet,
    species,
    mood,
    freezeLimit,
    onChangeCharacter,
}: {
    pet: Pet;
    species: PetSpecies;
    mood: PetMood;
    freezeLimit: number;
    onChangeCharacter: () => void;
}) => {
    const t = useTranslations("pet");
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(pet.name ?? "");
    const { mutateAsync: updateProfile, isPending } = useUpdatePetProfile();

    const name = pet.name || t(`species.${species}.defaultName`);

    const saveName = async () => {
        await updateProfile({ name: draft });
        setEditing(false);
    };

    return (
        <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
                <div className="grid justify-items-center gap-2">
                    <PetArt
                        species={species}
                        mood={mood}
                        equipped={pet.equipped}
                        className="mx-auto aspect-square w-full max-w-72"
                        title={name}
                        interactive
                        petLabel={t("petAction", { name })}
                    />
                    <p className="text-ink-muted text-center text-xs">{t("petHint")}</p>
                </div>

                <div className="grid gap-4">
                    {editing ? (
                        <form
                            className="flex gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void saveName();
                            }}
                        >
                            <Input
                                autoFocus
                                value={draft}
                                maxLength={20}
                                placeholder={t(`species.${species}.defaultName`)}
                                onChange={(event) => setDraft(event.target.value)}
                            />
                            <Button type="submit" disabled={isPending}>
                                {t("save")}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="font-display min-w-0 truncate text-3xl font-light tracking-tight">{name}</p>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("rename")}
                                onClick={() => {
                                    setDraft(pet.name ?? "");
                                    setEditing(true);
                                }}
                            >
                                <Pencil />
                            </Button>
                        </div>
                    )}

                    <p className="text-ink-muted -mt-2 text-sm leading-relaxed">{t(`moods.${mood}`, { name })}</p>

                    <dl className="grid grid-cols-2 gap-2">
                        <div className="bg-wash rounded-xl p-3">
                            <dt className="label">{t("coins")}</dt>
                            <dd className="mt-1 flex items-center gap-1.5 font-mono text-xl tabular-nums">
                                <Coin className="size-5" />
                                {pet.coins}
                            </dd>
                        </div>
                        <div className="bg-wash rounded-xl p-3">
                            <dt className="label">{t("freezes")}</dt>
                            <dd className="mt-1 flex items-center gap-1.5 font-mono text-xl tabular-nums">
                                <Snowflake className="size-5 text-sky-400" />
                                {pet.freezes}/{freezeLimit}
                            </dd>
                        </div>
                    </dl>

                    <Button variant="outline" size="sm" className="justify-self-start" onClick={onChangeCharacter}>
                        {t("changeCharacter")}
                    </Button>
                </div>
            </div>

            <div>
                <p className="label mb-2">{t("howToEarn")}</p>
                <ul className="border-rule border-t">
                    {PET_REWARD_GUIDE.map(({ kind, amount }) => (
                        <li key={kind} className="border-rule flex items-center justify-between gap-4 border-b py-2.5">
                            <span className="text-sm">{t(`guide.${kind}`)}</span>
                            <span className="flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums">
                                +{amount}
                                <Coin className="size-3.5" />
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="text-ink-faint mt-2 text-xs leading-relaxed">{t("multiplierNote")}</p>
            </div>
        </div>
    );
};
