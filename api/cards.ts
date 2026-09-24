import { useMutation } from "@tanstack/react-query";
import { transactionsAxios } from "config/axios.instances";
import { showAxiosError } from "lib/utils";
import useStore from "store/general";
import { CardsMutationResponse, CardTransferPayload, CreateCardPayload, UpdateCardPayload } from "types/transactions";

const applyCardsResponse = (response: CardsMutationResponse) => {
    const store = useStore.getState();
    store.applyServerUpdate({ updatedCards: response.updatedCards, totalAmount: response.totalAmount });
    store.setTransactions(response.updatedTransactions);
};

const createCard = async (payload: CreateCardPayload): Promise<CardsMutationResponse & { card: { id: string } }> => {
    const res = await transactionsAxios.post("cards", payload);
    return res.data;
};

const updateCard = async (payload: UpdateCardPayload): Promise<CardsMutationResponse> => {
    const res = await transactionsAxios.put("cards", payload);
    return res.data;
};

const reorderCards = async (ids: string[]): Promise<CardsMutationResponse> => {
    const res = await transactionsAxios.put("cards/order", { ids });
    return res.data;
};

const deleteCard = async ({ id, moveTo }: { id: string; moveTo: string }): Promise<CardsMutationResponse> => {
    const res = await transactionsAxios.delete(`cards/${id}`, { params: { moveTo } });
    return res.data;
};

const transferBetweenCards = async (payload: CardTransferPayload): Promise<CardsMutationResponse> => {
    const res = await transactionsAxios.post("cards/transfer", payload);
    return res.data;
};

export const useCreateCard = () =>
    useMutation({
        mutationKey: ["create-card"],
        mutationFn: createCard,
        onSuccess: applyCardsResponse,
        onError: showAxiosError,
    });

export const useUpdateCard = () =>
    useMutation({
        mutationKey: ["update-card"],
        mutationFn: updateCard,
        onSuccess: applyCardsResponse,
        onError: showAxiosError,
    });

export const useReorderCards = () =>
    useMutation({
        mutationKey: ["reorder-cards"],
        mutationFn: reorderCards,
        onSuccess: applyCardsResponse,
        onError: showAxiosError,
    });

export const useDeleteCard = () =>
    useMutation({
        mutationKey: ["delete-card"],
        mutationFn: deleteCard,
        onSuccess: applyCardsResponse,
        onError: showAxiosError,
    });

export const useCardTransfer = () =>
    useMutation({
        mutationKey: ["card-transfer"],
        mutationFn: transferBetweenCards,
        onSuccess: applyCardsResponse,
        onError: showAxiosError,
    });
