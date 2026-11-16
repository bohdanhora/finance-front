"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { useUpdatePetProfile } from "api/pet";
import { PET_SPECIES } from "lib/pet";
import { twMerge } from "lib/tw";
import { PetSpecies } from "types/pet";
import { Button } from "ui/button";
import { Input } from "ui/input";

import { PetArt } from "./pet-art";

export const PetPicker = ({
    current,
    name,
    onDone,
}: {
    current: PetSpecies | null;
    name: string | null;
    onDone?: () => void;
}) => {
    const t = useTranslations("pet");
    const [species, setSpecies] = useState<PetSpecies>(current ?? "bulldog");
    const [draft, setDraft] = useState(name ?? "");
    const { mutateAsync: updateProfile, isPending } = useUpdatePetProfile();

    const confirm = async () => {
        await updateProfile({ species, name: draft });
        onDone?.();
    };

    return (
        <div className="grid gap-5">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {PET_SPECIES.map((item) => {
                    const active = item === species;
                    return (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setSpecies(item)}
                            aria-pressed={active}
                            className={twMerge(
                                "border-rule bg-wash relative flex flex-col items-center gap-2 rounded-2xl border p-2 pb-3 text-left transition-colors",
                                active ? "border-accent bg-accent-wash" : "hover:border-rule-strong",
                            )}
                        >
                            <PetArt
                                species={item}
                                mood={active ? "happy" : "calm"}
                                className="aspect-square w-full"
                                title={t(`species.${item}.name`)}
                            />
                            <span className="text-center text-sm font-medium">{t(`species.${item}.name`)}</span>
                            <span className="text-ink-muted hidden text-center text-xs sm:block">
                                {t(`species.${item}.trait`)}
                            </span>
                            {active && (
                                <span className="bg-accent text-on-accent absolute top-3 right-3 flex size-6 items-center justify-center rounded-full">
                                    <Check className="size-3.5" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <label className="grid gap-2">
                <span className="label">{t("nameLabel")}</span>
                <Input
                    value={draft}
                    maxLength={20}
                    placeholder={t(`species.${species}.defaultName`)}
                    onChange={(event) => setDraft(event.target.value)}
                />
            </label>

            <Button variant="accent" size="lg" disabled={isPending} onClick={confirm}>
                {current ? t("saveCharacter") : t("chooseCharacter")}
            </Button>
        </div>
    );
};
