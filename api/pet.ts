import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { transactionsAxios } from "config/axios.instances";
import { showAxiosError } from "lib/utils";
import {
    PetBuyPayload,
    PetEquipPayload,
    PetProfilePayload,
    PetResponse,
    PetSyncPayload,
} from "types/pet";

export const PET_QUERY_KEY = ["pet"];

export const usePetQuery = (enabled = true) =>
    useQuery({
        queryKey: PET_QUERY_KEY,
        queryFn: async (): Promise<PetResponse> => (await transactionsAxios.get("pet")).data,
        enabled,
        staleTime: 60_000,
    });

const usePetMutation = <T>(key: string, request: (payload: T) => Promise<PetResponse>, silent = false) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["pet", key],
        mutationFn: request,
        onSuccess: (data) => {
            queryClient.setQueryData<PetResponse>(PET_QUERY_KEY, { ...data, granted: undefined });
        },
        onError: silent ? undefined : showAxiosError,
    });
};

export const useSyncPet = () =>
    usePetMutation<PetSyncPayload>(
        "sync",
        async (payload) => (await transactionsAxios.post("pet/sync", payload)).data,
        true,
    );

export const useBuyPetItem = () =>
    usePetMutation<PetBuyPayload>("buy", async (payload) => (await transactionsAxios.post("pet/buy", payload)).data);

export const useEquipPetItem = () =>
    usePetMutation<PetEquipPayload>(
        "equip",
        async (payload) => (await transactionsAxios.put("pet/equip", payload)).data,
    );

export const useUpdatePetProfile = () =>
    usePetMutation<PetProfilePayload>(
        "profile",
        async (payload) => (await transactionsAxios.put("pet/profile", payload)).data,
    );
