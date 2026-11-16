"use client";

import { useEffect, useMemo, useRef } from "react";

import { usePetQuery, useSyncPet } from "api/pet";
import { getPetMood } from "lib/pet";
import { toDayKey } from "lib/streak";
import useStore from "store/general";
import { PetReward } from "types/pet";

const SYNC_DELAY = 700;

export const usePet = (onGranted?: (rewards: PetReward[]) => void) => {
    const streak = useStore((state) => state.streak);
    const transactions = useStore((state) => state.transactions);
    const savingsOperations = useStore((state) => state.savingsOperations);
    const essentialsArray = useStore((state) => state.essentialsArray);

    const enabled = Boolean(streak);
    const query = usePetQuery(enabled);
    const { mutateAsync: syncPet } = useSyncPet();

    const grantedRef = useRef(onGranted);
    useEffect(() => {
        grantedRef.current = onGranted;
    }, [onGranted]);

    const checked = essentialsArray.filter((item) => item.checked).length;
    const signature = [
        streak?.lastVisit ?? "",
        streak?.current ?? 0,
        transactions.length,
        savingsOperations.length,
        `${checked}/${essentialsArray.length}`,
        toDayKey(),
    ].join("|");

    const lastSignature = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled || lastSignature.current === signature) return;

        const timer = window.setTimeout(async () => {
            lastSignature.current = signature;
            try {
                const result = await syncPet({ day: toDayKey(), offset: new Date().getTimezoneOffset() });
                if (result.granted?.length) grantedRef.current?.(result.granted);
            } catch {
                lastSignature.current = null;
            }
        }, SYNC_DELAY);

        return () => window.clearTimeout(timer);
    }, [enabled, signature, syncPet]);

    const mood = useMemo(() => getPetMood(transactions), [transactions]);

    return {
        pet: query.data?.pet ?? null,
        catalog: query.data?.catalog ?? [],
        freeze: query.data?.freeze ?? { price: 60, limit: 2 },
        mood,
        loading: query.isLoading,
    };
};
