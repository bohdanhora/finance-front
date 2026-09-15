import { useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsAxios } from "config/axios.instances";
import { AssistantPreferences, ConnectionsResponse } from "types/transactions";

export const CONNECTIONS_QUERY_KEY = ["connections"];

const fetchConnections = async (): Promise<ConnectionsResponse> => {
    const res = await transactionsAxios.get("connections");
    return res.data;
};

export const useConnections = () =>
    useQuery({
        queryKey: CONNECTIONS_QUERY_KEY,
        queryFn: fetchConnections,
        retry: false,
    });

export const putAssistantPreferences = async (assistant: AssistantPreferences) => {
    await transactionsAxios.put("connections/assistant", assistant);
};

export const putMonobankToken = async (token: string) => {
    await transactionsAxios.put("connections/monobank", { token });
};

const deleteMonobankToken = async () => {
    await transactionsAxios.delete("connections/monobank");
};

export const useConnectionsActions = () => {
    const queryClient = useQueryClient();

    const patch = (next: Partial<ConnectionsResponse>) =>
        queryClient.setQueryData<ConnectionsResponse>(CONNECTIONS_QUERY_KEY, (current) =>
            current ? { ...current, ...next } : current,
        );

    return {
        saveAssistant: async (assistant: AssistantPreferences) => {
            await putAssistantPreferences(assistant);
            patch({ assistant });
        },
        saveMonobankToken: async (token: string) => {
            await putMonobankToken(token);
            patch({ monobankToken: token });
        },
        clearMonobankToken: async () => {
            await deleteMonobankToken();
            patch({ monobankToken: null });
        },
    };
};
