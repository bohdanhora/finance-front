"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { usePet } from "hooks/use-pet";
import { useStreak } from "hooks/use-streak";
import { getStreakTier, toDayKey } from "lib/streak";
import { twMerge } from "lib/tw";
import { PetReward } from "types/pet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";

import { StreakMeter } from "../streak/streak-meter";
import { StreakDetails } from "../streak/streak-dialog";
import { Coin } from "./coin";
import { PetArt } from "./pet-art";
import { PetHome } from "./pet-home";
import { PetPicker } from "./pet-picker";
import { PetShop } from "./pet-shop";

type View = "home" | "shop" | "streak";

const VIEWS: View[] = ["home", "shop", "streak"];

export const PetBadge = () => {
    const t = useTranslations("pet");
    const tStreak = useTranslations("streak");
    const { record, reached, frozen, clearMilestone } = useStreak();

    const onGranted = useCallback(
        (rewards: PetReward[]) => {
            const total = rewards.reduce((sum, reward) => sum + reward.amount, 0);
            const reasons = rewards.map((reward) => t(`rewards.${reward.kind}`, { days: reward.days ?? 0 })).join(", ");
            toast.success(t("grantedToast", { amount: total, reasons }));
        },
        [t],
    );

    const { pet, catalog, freeze, mood } = usePet(onGranted);

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<View>("home");
    const [picking, setPicking] = useState(false);

    useEffect(() => {
        if (!reached) return;
        toast.success(tStreak("milestoneToast", { days: reached }));
        clearMilestone();
    }, [clearMilestone, reached, tStreak]);

    useEffect(() => {
        if (!frozen) return;
        toast.info(t("frozenToast", { count: frozen }));
        clearMilestone();
    }, [clearMilestone, frozen, t]);

    if (!record) return null;

    const tier = getStreakTier(record.current);
    const visitedToday = record.history.includes(toDayKey());
    const species = pet?.species ?? null;
    const choosing = Boolean(pet) && (!species || picking);

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                if (!value) setPicking(false);
            }}
        >
            <DialogTrigger asChild>
                <button
                    type="button"
                    data-tour="streak"
                    aria-label={tStreak("badgeLabel", { days: record.current })}
                    className="border-rule hover:border-rule-strong flex h-9 shrink-0 items-center gap-2 rounded-full border pr-3 pl-1 transition-colors"
                >
                    <span
                        className={twMerge(
                            "bg-wash relative flex size-7 items-center justify-center overflow-hidden rounded-full",
                            !species && "pet-nudge",
                        )}
                    >
                        {species ? (
                            <PetArt
                                species={species}
                                mood={mood}
                                equipped={pet?.equipped}
                                scene={false}
                                className="size-9"
                            />
                        ) : (
                            <span className="text-sm">?</span>
                        )}
                    </span>
                    <StreakMeter tier={tier.key} live={visitedToday} className="h-3.5" />
                    <span className="font-mono text-xs tabular-nums">{record.current}</span>
                    {pet && (
                        <span className="border-rule flex items-center gap-1 border-l pl-2 font-mono text-xs tabular-nums">
                            <Coin className="size-3.5" />
                            {pet.coins}
                        </span>
                    )}
                </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-dialog-wide">
                {choosing && pet ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t("pickTitle")}</DialogTitle>
                            <DialogDescription>{t("pickSubtitle")}</DialogDescription>
                        </DialogHeader>
                        <PetPicker current={species} name={pet.name} onDone={() => setPicking(false)} />
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t("title")}</DialogTitle>
                            <DialogDescription>{t("subtitle")}</DialogDescription>
                        </DialogHeader>

                        <div className="bg-wash flex gap-1 rounded-xl p-1">
                            {VIEWS.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setView(item)}
                                    aria-pressed={view === item}
                                    className={twMerge(
                                        "text-ink-muted h-9 flex-1 rounded-lg text-sm font-medium transition-colors",
                                        view === item ? "bg-surface text-ink shadow-lg" : "hover:text-ink",
                                    )}
                                >
                                    {t(`views.${item}`)}
                                </button>
                            ))}
                        </div>

                        {pet && species && view === "home" && (
                            <PetHome
                                pet={pet}
                                species={species}
                                mood={mood}
                                freezeLimit={freeze.limit}
                                onChangeCharacter={() => setPicking(true)}
                            />
                        )}
                        {pet && species && view === "shop" && (
                            <PetShop pet={pet} species={species} catalog={catalog} freeze={freeze} />
                        )}
                        {view === "streak" && <StreakDetails record={record} withHeader={false} />}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
